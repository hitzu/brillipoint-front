// SVG icons shared by `SocialCta` and `PrimaryActionButton`. `currentColor`
// throughout so they follow whatever text color the surrounding button/badge
// class sets — no hardcoded brand palette beyond each network's own mark.

export const IconWhatsapp = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path
      d="M16 2.667C8.643 2.667 2.667 8.643 2.667 16c0 2.373.62 4.691 1.799 6.73L2.667 29.333l6.843-1.769A13.27 13.27 0 0 0 16 29.333c7.357 0 13.333-5.976 13.333-13.333S23.357 2.667 16 2.667Zm0 24A10.6 10.6 0 0 1 10.4 25.07l-.4-.235-4.06 1.05 1.085-3.956-.26-.41A10.61 10.61 0 1 1 16 26.667Z"
      fill="currentColor"
      opacity="0.9"
    />
    <path
      d="M22.24 18.645c-.33-.165-1.957-.965-2.26-1.076-.303-.11-.524-.165-.744.165-.22.33-.855 1.076-1.05 1.296-.193.22-.386.247-.716.082-.33-.165-1.395-.514-2.658-1.64-.982-.876-1.645-1.958-1.84-2.288-.193-.33-.021-.509.144-.674.149-.148.33-.386.495-.579.165-.193.22-.33.33-.55.11-.22.055-.413-.028-.579-.082-.165-.744-1.797-1.02-2.46-.268-.642-.54-.555-.744-.565l-.634-.012c-.22 0-.578.082-.88.413-.303.33-1.156 1.13-1.156 2.756 0 1.626 1.185 3.198 1.35 3.418.165.22 2.333 3.56 5.65 4.99.79.34 1.405.543 1.885.695.792.252 1.512.217 2.08.132.635-.095 1.957-.8 2.233-1.57.275-.772.275-1.434.193-1.57-.082-.138-.303-.22-.634-.386Z"
      fill="currentColor"
    />
  </svg>
);

export const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Z"
      fill="currentColor"
      opacity="0.95"
    />
    <path
      d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      fill="currentColor"
    />
    <path d="M17.6 6.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" fill="currentColor" />
  </svg>
);

export const IconTiktok = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z"
      fill="currentColor"
    />
  </svg>
);

export const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M13.5 21v-7h2.4l.4-3H13.5V9.2c0-.87.24-1.46 1.5-1.46h1.6V5.06c-.28-.04-1.24-.12-2.36-.12-2.33 0-3.94 1.42-3.94 4.03V11H8v3h2.8v7h2.7Z"
      fill="currentColor"
    />
  </svg>
);

/** Generic external-link mark used for the `url` primary-action channel. */
export const IconExternalLink = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
