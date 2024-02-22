import * as tailwindcss_types_config from 'tailwindcss/types/config';

/*!
 * Portions of this file are based on code from headlessui.
 * MIT Licensed, Copyright (c) 2020 Tailwind Labs.
 *
 * Credits to the Tailwind Labs team:
 * https://github.com/tailwindlabs/headlessui/blob/8e1e19f94c28af68c05becc80bf89575e1fa1d36/packages/@headlessui-tailwindcss/src/index.ts
 */
interface KobalteTailwindPluginOptions {
    /** The prefix of generated classes. */
    prefix?: string;
}
declare const _default: {
    (options: KobalteTailwindPluginOptions): {
        handler: tailwindcss_types_config.PluginCreator;
        config?: Partial<tailwindcss_types_config.Config> | undefined;
    };
    __isOptionsFunction: true;
};

export { KobalteTailwindPluginOptions, _default as default };
