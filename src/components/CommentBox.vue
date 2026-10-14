<script setup lang="ts">
//
import { useEventListener, watchImmediate } from '@vueuse/core';
import type { WalineComment, WalineCommentData, UserInfo } from '@waline/api';
import { addComment, login, updateComment } from '@waline/api';
import autosize from 'autosize';
import type { DeepReadonly, CSSProperties } from 'vue';
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';

import { useConfig, useEditor, useUserInfo, useUserMeta } from '../composables/index.js';
import type { WalineEmojiConfig } from '../utils/index.js';
import {
  getEmojisInfo,
  getImageFromDataTransfer,
  getWordNumber,
  isValidEmail,
  parseEmoji,
  userAgent,
} from '../utils/index.js';
import { CloseIcon, EmojiIcon, ImageIcon, LoadingIcon } from './Icons.js';

// oxlint-disable-next-line vue/define-props-destructuring
const props = defineProps<{
  /** Current comment to be edited */
  edit?: WalineComment | null;
  /** Root comment id */
  rootId?: number;
  /** Comment id to be replied */
  replyId?: number;
  /** User name to be replied */
  replyUser?: string;
}>();

const emit = defineEmits<{
  (event: 'log' | 'cancelEdit' | 'cancelReply'): void;
  (event: 'submit', comment: WalineComment): void;
}>();

const { config, locale } = useConfig();

const editor = useEditor();
const userMeta = useUserMeta();
const userInfo = useUserInfo();

const inputRefs = ref<Record<string, HTMLInputElement>>({});
const textAreaRef = useTemplateRef<HTMLTextAreaElement>('textarea');
const imageUploaderRef = useTemplateRef<HTMLInputElement>('image-uploader');
const emojiButtonRef = useTemplateRef<HTMLDivElement>('emoji-button');
const emojiPopupRef = useTemplateRef<HTMLDivElement>('emoji-popup');

const emoji = ref<DeepReadonly<WalineEmojiConfig>>({ tabs: [], map: {} });
const emojiTabIndex = ref(0);
const showEmoji = ref(false);
const previewEmoji = ref('');
const previewStyle = ref<CSSProperties>({});
let leaveTimer: ReturnType<typeof setTimeout>;

const onEmojiHover = (event: MouseEvent, key: string): void => {
  clearTimeout(leaveTimer);
  previewEmoji.value = key;

  const target = event.currentTarget as HTMLElement | null;
  const popup = emojiPopupRef.value;

  if (target && popup) {
    const targetRect = target.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    previewStyle.value = {
      left: `${targetRect.left - popupRect.left + targetRect.width / 2}px`,
      top: `${targetRect.top - popupRect.top}px`,
      transform: 'translate(-50%, -100%)',
    };
  }
};

const onEmojiLeave = (): void => {
  leaveTimer = setTimeout(() => {
    previewEmoji.value = '';
  }, 50);
};

const wordNumber = ref(0);

const wordLimitDisplay = ref(0);
const isWordNumberLegal = ref(false);

const content = ref('');

const isSubmitting = ref(false);

const isLogin = computed(() => Boolean(userInfo.value.token));

const canUploadImage = computed(() => config.value.imageUploader != null);

const insert = (text: string): void => {
  // oxlint-disable-next-line typescript/no-non-null-assertion
  const textArea = textAreaRef.value!;
  const startPosition = textArea.selectionStart;
  const endPosition = textArea.selectionEnd || 0;
  const { scrollTop } = textArea;

  editor.value = textArea.value.slice(0, startPosition) + text + textArea.value.slice(endPosition);
  textArea.focus();
  textArea.selectionStart = startPosition + text.length;
  textArea.selectionEnd = startPosition + text.length;
  textArea.scrollTop = scrollTop;
};

const uploadImage = async (file: File): Promise<void> => {
  const uploadText = `![${config.value.locale.uploading} ${file.name}]()`;

  insert(uploadText);
  isSubmitting.value = true;

  try {
    // oxlint-disable-next-line typescript/no-non-null-assertion
    const url = await config.value.imageUploader!(file);

    editor.value = editor.value.replace(uploadText, `\r\n![${file.name}](${url})`);
  } catch (err) {
    alert((err as Error).message);
    editor.value = editor.value.replace(uploadText, '');
  } finally {
    isSubmitting.value = false;
  }
};

const onEditorDrop = (event: DragEvent): void => {
  if (event.dataTransfer?.items) {
    const file = getImageFromDataTransfer(event.dataTransfer.items);

    if (file && canUploadImage.value) {
      void uploadImage(file);
      event.preventDefault();
    }
  }
};

const onEditorPaste = (event: ClipboardEvent): void => {
  if (event.clipboardData) {
    const file = getImageFromDataTransfer(event.clipboardData.items);

    if (file && canUploadImage.value) {
      void uploadImage(file);
    }
  }
};

const onImageChange = (): void => {
  // oxlint-disable-next-line typescript/no-non-null-assertion
  const inputElement = imageUploaderRef.value!;
  const file = inputElement.files?.[0];

  if (file && canUploadImage.value) {
    void uploadImage(file).then(() => {
      // clear input so a same image can be uploaded later
      inputElement.value = '';
    });
  }
};

const syncUserMeta = ({ link, mail, nick }: Partial<WalineCommentData>): void => {
  userMeta.value = {
    nick: nick ?? '',
    mail: mail ?? '',
    link: link ?? '',
  };
};

// 填充登录用户信息，或在未登录时校验必填的评论者信息；返回 false 表示应中断提交
const validateMeta = (comment: WalineCommentData): boolean => {
  const { login, requiredMeta } = config.value;

  // https://github.com/walinejs/waline/issues/2163
  if (userInfo.value.token) {
    // login user
    comment.nick = userInfo.value.display_name;
    comment.mail = userInfo.value.email;
    comment.link = userInfo.value.url;

    return true;
  }

  if (login === 'force') {
    return false;
  }

  // check nick
  if (requiredMeta.includes('nick') && !comment.nick) {
    inputRefs.value.nick.focus();

    alert(locale.value.nickError);

    return false;
  }

  // check mail
  if (
    (requiredMeta.includes('mail') && !comment.mail) ||
    (comment.mail && !isValidEmail(comment.mail))
  ) {
    inputRefs.value.mail.focus();

    alert(locale.value.mailError);

    return false;
  }

  comment.nick ||= locale.value.anonymous;

  return true;
};

// 校验评论内容非空且字数合法
const validateComment = (comment: WalineCommentData): boolean => {
  const { wordLimit } = config.value;

  // check comment
  if (!comment.comment) {
    // oxlint-disable-next-line typescript/no-non-null-assertion
    textAreaRef.value!.focus();

    return false;
  }

  if (!isWordNumberLegal.value) {
    alert(
      locale.value.wordHint
        .replace('$0', (wordLimit as [number, number])[0].toString())
        .replace('$1', (wordLimit as [number, number])[1].toString())
        .replace('$2', wordNumber.value.toString()),
    );

    return false;
  }

  return true;
};

// 发送评论（新增或更新）并处理结果
const sendComment = async (comment: WalineCommentData): Promise<void> => {
  const { serverURL, lang } = config.value;

  isSubmitting.value = true;

  try {
    const options = {
      serverURL,
      lang,
      token: userInfo.value.token,
      comment,
    };

    const response = await (props.edit
      ? updateComment({
          objectId: props.edit.objectId,
          ...options,
        })
      : addComment(options));

    isSubmitting.value = false;

    if (response.errmsg) {
      alert(response.errmsg);

      return;
    }

    // oxlint-disable-next-line typescript/no-non-null-assertion
    emit('submit', response.data!);

    editor.value = '';

    // ensure changes are applied to dom to avoid  https://github.com/walinejs/waline/issues/2371
    await nextTick();

    if (props.replyId) {
      emit('cancelReply');
    }
    if (props.edit?.objectId) {
      emit('cancelEdit');
    }
  } catch (err: unknown) {
    isSubmitting.value = false;

    alert((err as TypeError).message);
  }
};

const submitComment = async (): Promise<void> => {
  const comment: WalineCommentData = {
    comment: content.value,
    nick: userMeta.value.nick,
    mail: userMeta.value.mail,
    link: userMeta.value.link,
    url: config.value.path,
    ua: await userAgent(),
  };

  if (!props.edit) {
    if (!validateMeta(comment)) {
      return;
    }

    syncUserMeta(comment);
  }

  if (!validateComment(comment)) {
    return;
  }

  comment.comment = parseEmoji(comment.comment, emoji.value.map);

  if (props.replyId && props.rootId) {
    comment.pid = props.replyId;
    comment.rid = props.rootId;
    comment.at = props.replyUser;
  }

  await sendComment(comment);
};

const onEditorKeyDown = ({ key, ctrlKey, metaKey }: KeyboardEvent): void => {
  // avoid submitting same comment multiple times
  if (isSubmitting.value) {
    return;
  }

  // submit comment when pressing cmd|ctrl + enter
  if ((ctrlKey || metaKey) && key === 'Enter') {
    void submitComment();
  }
};

const onLogin = (event: Event): void => {
  event.preventDefault();
  const { lang, serverURL } = config.value;

  void login({
    serverURL,
    lang,
  }).then((data) => {
    userInfo.value = data;
    syncUserMeta({ nick: data.display_name, mail: data.email, link: data.url });
    emit('log');
  });
};

const onLogout = (): void => {
  userInfo.value = {};
  emit('log');
};

const onProfile = (event: Event): void => {
  event.preventDefault();

  const { lang, serverURL } = config.value;
  const { origin } = new URL(serverURL);

  const width = 1200;
  const height = 720;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  const query = new URLSearchParams({
    lng: lang,
    token: userInfo.value.token,
  });
  const handler = window.open(
    `${serverURL}/ui/profile?${query.toString()}`,
    '_blank',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no`,
  );

  handler?.postMessage({ type: 'TOKEN', data: userInfo.value.token }, origin);
};

const popupHandler = (event: MouseEvent): void => {
  if (
    !emojiButtonRef.value?.contains(event.target as Node) &&
    !emojiPopupRef.value?.contains(event.target as Node)
  ) {
    showEmoji.value = false;
  }
};

useEventListener('click', popupHandler);
useEventListener(
  'message',
  ({ data, origin }: MessageEvent<{ type: 'profile'; data: UserInfo }>) => {
    // only accept messages from the configured Waline server
    if (origin !== new URL(config.value.serverURL).origin || data?.type !== 'profile') {
      return;
    }

    userInfo.value = { ...userInfo.value, ...data.data };
    syncUserMeta({
      nick: userInfo.value.display_name,
      mail: userInfo.value.email,
      link: userInfo.value.url,
    });
  },
);

// start tracking comment word number
watchImmediate([config, wordNumber], ([config, wordNumber]) => {
  const { wordLimit: limit } = config;

  if (limit) {
    if (wordNumber < limit[0]) {
      [wordLimitDisplay.value] = limit;
      isWordNumberLegal.value = false;
    } else {
      [, wordLimitDisplay.value] = limit;
      isWordNumberLegal.value = wordNumber <= limit[1];
    }
  } else {
    wordLimitDisplay.value = 0;
    isWordNumberLegal.value = true;
  }
});

onMounted(() => {
  if (props.edit?.objectId) {
    editor.value = props.edit.orig;
  }

  // watch editor
  watchImmediate(
    () => editor.value,
    (value) => {
      content.value = value;
      wordNumber.value = getWordNumber(value);

      // oxlint-disable-next-line typescript/no-non-null-assertion
      if (value) autosize(textAreaRef.value!);
      // oxlint-disable-next-line typescript/no-non-null-assertion
      else autosize.destroy(textAreaRef.value!);
    },
  );

  // watch emoji value change
  watchImmediate(
    () => config.value.emoji,
    async (emojiConfig) => {
      emoji.value = await getEmojisInfo(emojiConfig);
    },
  );
});
</script>

<template>
  <div :key="userInfo.token" class="wl-comment">
    <div v-if="config.login !== 'disable' && isLogin && !edit?.objectId" class="wl-login-info">
      <div class="wl-avatar">
        <button type="submit" class="wl-logout-btn" :title="locale.logout" @click="onLogout">
          <CloseIcon :size="14" />
        </button>

        <a
          href="#"
          class="wl-login-nick"
          aria-label="Profile"
          :title="locale.profile"
          @click="onProfile"
        >
          <img :src="userInfo.avatar" alt="avatar" />
        </a>
      </div>

      <a
        href="#"
        class="wl-login-nick"
        aria-label="Profile"
        :title="locale.profile"
        @click="onProfile"
        v-text="userInfo.display_name"
      />
    </div>

    <div class="wl-panel">
      <div
        v-if="config.login !== 'force' && config.meta.length && !isLogin"
        class="wl-header"
        :class="`item${config.meta.length}`"
      >
        <div v-for="kind in config.meta" :key="kind" class="wl-header-item">
          <label
            :for="`wl-${kind}`"
            v-text="
              locale[kind] +
              (config.requiredMeta.includes(kind) || !config.requiredMeta.length
                ? ''
                : `(${locale.optional})`)
            "
          />

          <input
            :id="`wl-${kind}`"
            :ref="
              (element) => {
                if (element) inputRefs[kind] = element as HTMLInputElement;
              }
            "
            v-model="userMeta[kind]"
            class="wl-input"
            :class="`wl-${kind}`"
            :name="kind"
            :type="kind === 'mail' ? 'email' : 'text'"
          />
        </div>
      </div>

      <textarea
        id="wl-edit"
        ref="textarea"
        v-model="editor"
        class="wl-editor"
        :placeholder="replyUser ? `@${replyUser}` : locale.placeholder"
        @keydown="onEditorKeyDown"
        @drop="onEditorDrop"
        @paste="onEditorPaste"
      />

      <div class="wl-footer">
        <div class="wl-actions">
          <button
            v-show="emoji.tabs.length"
            ref="emoji-button"
            type="button"
            class="wl-action"
            :class="{ active: showEmoji }"
            :title="locale.emoji"
            @click="showEmoji = !showEmoji"
          >
            <EmojiIcon />
          </button>

          <input
            id="wl-image-upload"
            ref="image-uploader"
            class="upload"
            aria-hidden="true"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.bmp,.gif"
            @change="onImageChange"
          />

          <label
            v-if="canUploadImage"
            for="wl-image-upload"
            class="wl-action"
            :title="locale.uploadImage"
            :aria-label="locale.uploadImage"
          >
            <ImageIcon />
          </label>
        </div>

        <div class="wl-info">
          <div class="wl-text-number">
            {{ wordNumber }}

            <span v-if="config.wordLimit">
              &nbsp;/&nbsp;
              <span :class="{ illegal: !isWordNumberLegal }" v-text="wordLimitDisplay" />
            </span>

            &nbsp;{{ locale.word }}
          </div>

          <button
            v-if="config.login !== 'disable' && !isLogin"
            type="button"
            class="wl-btn"
            @click="onLogin"
            v-text="locale.login"
          />

          <button
            v-if="config.login !== 'force' || isLogin"
            type="submit"
            class="primary wl-btn"
            title="Cmd|Ctrl + Enter"
            :disabled="isSubmitting"
            @click="submitComment"
          >
            <LoadingIcon v-if="isSubmitting" :size="16" />

            <template v-else>
              {{ locale.submit }}
            </template>
          </button>
        </div>

        <div ref="emoji-popup" class="wl-emoji-popup" :class="{ display: showEmoji }">
          <template v-for="(emojiItem, index) in emoji.tabs" :key="emojiItem.name">
            <div v-if="index === emojiTabIndex" class="wl-tab-wrapper" @scroll="onEmojiLeave">
              <button
                v-for="key in emojiItem.items"
                :key="key"
                type="button"
                :title="key"
                @click="insert(`:${key}:`)"
                @mouseenter="onEmojiHover($event, key)"
                @mouseleave="onEmojiLeave"
              >
                <img
                  v-if="showEmoji"
                  class="wl-emoji"
                  :src="emoji.map[key]"
                  :alt="key"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </button>
            </div>
          </template>

          <div>
            <img
              v-if="previewEmoji"
              class="wl-emoji-preview"
              :src="emoji.map[previewEmoji]"
              alt="preview"
              loading="lazy"
              referrerPolicy="no-referrer"
              :style="previewStyle"
            />
          </div>

          <div v-if="emoji.tabs.length > 1" class="wl-tabs">
            <button
              v-for="(emojiItem, index) in emoji.tabs"
              :key="emojiItem.name"
              type="button"
              class="wl-tab"
              :class="{ active: emojiTabIndex === index }"
              @click="emojiTabIndex = index"
            >
              <img
                class="wl-emoji"
                :src="emojiItem.icon"
                :alt="emojiItem.name"
                :title="emojiItem.name"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="replyId || edit?.objectId"
      type="button"
      class="wl-close"
      :title="locale.cancelReply"
      @click="replyId ? emit('cancelReply') : emit('cancelEdit')"
    >
      <CloseIcon :size="24" />
    </button>
  </div>
</template>
