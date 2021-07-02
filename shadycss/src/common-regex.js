export const VAR_ASSIGN=/(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};{])+)|\{([^}]*)\}(?:(?=[;\s}])|$))/gi;export const MIXIN_MATCH=/(?:^|\W+)@apply\s*\(?([^);\n]*)\)?/gi;export const VAR_CONSUMED=/(--[\w-]+)\s*([:,;)]|$)/gi;export const ANIMATION_MATCH=/(animation\s*:)|(animation-name\s*:)/;export const MEDIA_MATCH=/@media\s(.*)/;export const IS_VAR=/^--/;export const BRACKETED=/\{[^}]*\}/g;export const HOST_PREFIX="(?:^|[^.#[:])";export const HOST_SUFFIX="($|[.:[\\s>+~])";