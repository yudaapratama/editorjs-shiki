import './index.css';
import type { API, BlockTool, BlockToolConstructorOptions, BlockToolData, PasteConfig, PasteEvent, SanitizerConfig, ToolboxConfig } from '@editorjs/editorjs';
import { codeToHtml, bundledLanguagesInfo as languages, bundledThemesInfo as themes } from 'shiki/bundle/web'
import { getLineStartPosition } from './utils/string';

/**
 * CodeTool for Editor.js
 * @version 1.0.0
 * @license MIT
 */

/**
 * Data structure for CodeTool's data
 */
export type CodeData = BlockToolData<{
  /**
   * The code content input by the user
   */
  code: string;
  lang: string;
  theme: string;
}>;

/**
 * Configuration options for the CodeTool provided by the user
 */
export interface CodeConfig {
  /**
   * Placeholder text to display in the input field when it's empty
   */
  placeholder: string;
}

/**
 * Defines the CSS class names used by CodeTool for styling its elements
 */
interface CodeToolCSS {
  /** Block Styling from Editor.js API */
  baseClass: string;
  /** Input Styling from Editor.js API */
  input: string;
  /** Wrapper styling */
  wrapper: string;
  /** Textarea styling */
  textarea: string;
  /** Span styling */
  span: string;
  /** Selector Language styling */
  selectorLanguage: string;
  /** Selector Theme styling */
  selectorTheme: string;
}

/**
 * Holds references to the DOM elements used by CodeTool
 */
interface CodeToolNodes {
  /** Main container or Wrapper for CodeTool */
  holder: HTMLDivElement | null;
  /** Textarea where user inputs their code */
  textarea: HTMLTextAreaElement | null;
}

/**
 * Options passed to the constructor of a block tool
 */
export type CodeToolConstructorOptions = BlockToolConstructorOptions<CodeData>;

/**
 * Code Tool for the Editor.js allows to include code examples in your articles.
 */
export default class CodeTool implements BlockTool {
  /**
   * API provided by Editor.js for interacting with the editor's core functionality
   */
  private api: API;
  /**
   * Indicates whether the editor is in read-only mode, preventing modifications
   */
  private readOnly: boolean;
  /**
   * Placeholder text displayed when there is no code content
   */
  private placeholder: string;
  /**
   * Collection of CSS class names used by CodeTool for styling its elements
   */
  private CSS: CodeToolCSS;
  /**
   * DOM nodes related to the CodeTool, including containers and other elements
   */
  private nodes: CodeToolNodes;
  /**
   * Stores the current data (code and other related properties) for the CodeTool
   */
  private _data!: CodeData;
  /**
   * Default language for the CodeTool
   */
  private _selectorLanguage: string = '';
  /**
   * Default theme for the CodeTool
   */
  private _selectorTheme: string = '';
  /**
   * Notify core that read-only mode is supported
   * @returns true if read-only mode is supported
   */
  public static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Allows pressing Enter key to create line breaks inside the CodeTool textarea
   * This enables multi-line input within the code editor.
   * @returns true if line breaks are allowed in the textarea
   */
  public static get enableLineBreaks(): boolean {
    return true;
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   * @param options - tool constricting options
   * @param options.data — previously saved plugin code
   * @param options.config - user config for Tool
   * @param options.api - Editor.js API
   * @param options.readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }: CodeToolConstructorOptions) {
    this.api = api;
    this.readOnly = readOnly;

    this.placeholder = this.api.i18n.t(config.placeholder as string || CodeTool.DEFAULT_PLACEHOLDER);

    this._selectorLanguage = data.lang || config.lang || CodeTool.DEFAULT_LANGUAGE
    this._selectorTheme = data.theme || config.theme || CodeTool.DEFAULT_THEME

    this.CSS = {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      wrapper: 'ce-editorjs-x-shiki',
      textarea: 'ce-editorjs-x-shiki__textarea',
      span: 'ce-editorjs-x-shiki__span',
      selectorLanguage: 'ce-editorjs-x-shiki__selector-language',
      selectorTheme: 'ce-editorjs-x-shiki__selector-theme',
    };

    this.nodes = {
      holder: null,
      textarea: null,
    };

    this.data = {
      code: data.code ?? '',
      lang: this._selectorLanguage,
      theme: this._selectorTheme,
    };

    this.nodes.holder = this.drawView()
  }

  /**
   * Return Tool's view
   * @returns this.nodes.holder - Code's wrapper
   */
  public render(): HTMLDivElement {
    return this.nodes.holder!;
  }

  /**
   * Extract Tool's data from the view
   * @param codeWrapper - CodeTool's wrapper, containing textarea with code
   * @returns - saved plugin code
   */
  public save(codeWrapper: HTMLDivElement): CodeData {
    return {
      code: codeWrapper.querySelector('textarea')!.value,
      lang: this._selectorLanguage,
      theme: this._selectorTheme
    };
  }

  /**
   * onPaste callback fired from Editor`s core
   * @param event - event with pasted content
   */
  public onPaste(event: PasteEvent): void {
    const detail = event.detail;

    if ('data' in detail) {
      const content = detail.data as string;

      this.data = {
        code: content || '',
        lang: this._selectorLanguage,
        theme: this._selectorTheme
      };
    }
  }

  /**
   * Returns Tool`s data from private property
   * @returns
   */
  public get data(): CodeData {
    return this._data;
  }

  /**
   * Set Tool`s data to private property and update view
   * @param data - saved tool data
   */
  public set data(data: CodeData) {
    this._data = data;

    if (this.nodes.textarea) {
      this.nodes.textarea.value = data.code;
    }
  }

  /**
   * Get Tool toolbox settings.
   * Provides the icon and title to display in the toolbox for the CodeTool.
   * @returns An object containing:
   * - icon: SVG representation of the Tool's icon
   * - title: Title to show in the toolbox
   */
  public static get toolbox(): ToolboxConfig {
    return {
      icon: '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="m17.09 7.974.23.23c1.789 1.79 2.684 2.684 2.684 3.796s-.895 2.007-2.684 3.796l-.23.23M13.876 5l-3.751 14M6.91 7.974l-.23.23C4.892 9.994 3.997 10.888 3.997 12s.895 2.007 2.685 3.796l.23.23"/></svg>',
      title: 'CodeShiki',
    };
  }

  /**
   * Default placeholder for CodeTool's textarea
   * @returns
   */
  public static get DEFAULT_PLACEHOLDER(): string {
    return 'Enter your code ';
  }

  /**
   * Default language for CodeTool's textarea
   * @returns
   */
  public static get DEFAULT_LANGUAGE(): string {
    return 'javascript';
  }

  /**
   * Default theme for CodeTool's textarea
   * @returns
   */
  public static get DEFAULT_THEME(): string {
    return 'vitesse-dark';
  }

  /**
   *  Used by Editor.js paste handling API.
   *  Provides configuration to handle CODE tag.
   * @returns
   */
  public static get pasteConfig(): PasteConfig {
    return {
      tags: ['pre'],
    };
  }

  /**
   * Automatic sanitize config
   * @returns
   */
  public static get sanitize(): SanitizerConfig {
    return {
      code: true, // Allow HTML tags
    };
  }

  /**
   * Handles Tab key pressing (adds/removes indentations)
   * @param event - keydown
   */
  private tabHandler(event: KeyboardEvent): void {
    /**
     * Prevent editor.js tab handler
     */
    event.stopPropagation();

    /**
     * Prevent native tab behaviour
     */
    event.preventDefault();

    const textarea = event.target as HTMLTextAreaElement;
    const isShiftPressed = event.shiftKey;
    const caretPosition = textarea.selectionStart;
    const value = textarea.value;
    const indentation = '  ';

    let newCaretPosition;

    /**
     * For Tab pressing, just add an indentation to the caret position
     */
    if (!isShiftPressed) {
      newCaretPosition = caretPosition + indentation.length;

      textarea.value = value.substring(0, caretPosition) + indentation + value.substring(caretPosition);
    } else {
      /**
       * For Shift+Tab pressing, remove an indentation from the start of line
       */
      const currentLineStart = getLineStartPosition(value, caretPosition);
      const firstLineChars = value.substr(currentLineStart, indentation.length);

      if (firstLineChars !== indentation) {
        return;
      }

      /**
       * Trim the first two chars from the start of line
       */
      textarea.value = value.substring(0, currentLineStart) + value.substring(currentLineStart + indentation.length);
      newCaretPosition = caretPosition - indentation.length;
    }

    /**
     * Restore the caret
     */
    textarea.setSelectionRange(newCaretPosition, newCaretPosition);
  }

  /**
   * Create Tool's view
   * @returns
   */
  private drawView(): HTMLDivElement {
    const wrapper = document.createElement('div');
    const wrapperHolder = document.createElement('div');
    const wrapperSelectorHolder = document.createElement('div');
    const wrapperLang = document.createElement('div');

    const selectorLanguage = document.createElement('select');
    const selectorTheme = document.createElement('select');
    const span = document.createElement('span');
    const textarea = document.createElement('textarea');

    wrapper.classList.add(this.CSS.baseClass, this.CSS.wrapper);
    wrapperHolder.classList.add('ce-editorjs-x-shiki__code');
    wrapperSelectorHolder.classList.add('ce-editorjs-x-shiki__selector');
    wrapperLang.classList.add('ce-editorjs-x-shiki__lang');

    selectorLanguage.classList.add(this.CSS.selectorLanguage);
    selectorTheme.classList.add(this.CSS.selectorTheme);
    textarea.classList.add(this.CSS.textarea, this.CSS.input);

    wrapperLang.innerHTML = this.data.lang

    languages.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.id;
      option.text = lang.name;
      selectorLanguage.appendChild(option);
    });
    selectorLanguage.value = this.data.lang

    themes.forEach((theme) => {
      const option = document.createElement('option');
      option.value = theme.id;
      option.text = theme.displayName;
      selectorTheme.appendChild(option);
    });
    selectorTheme.value = this.data.theme

    textarea.value = this.data.code;
    textarea.placeholder = this.placeholder;
    textarea.spellcheck = false;
    textarea.autocomplete = "off"
    textarea.autocapitalize = "off"

    if (this.readOnly) {
      textarea.disabled = true;
    }

    wrapperHolder.appendChild(span);
    wrapperHolder.appendChild(textarea);

    if(!this.readOnly) {
      wrapperSelectorHolder.appendChild(selectorLanguage);
      wrapperSelectorHolder.appendChild(selectorTheme);
      wrapper.appendChild(wrapperSelectorHolder);
    }

    wrapper.appendChild(wrapperHolder);
    wrapper.appendChild(wrapperLang);

    this.runShiki().then(({ html, preStyle }) => {

      span.innerHTML = html
      wrapper?.setAttribute('style', preStyle)
      selectorLanguage.setAttribute('style', preStyle)
      selectorTheme.setAttribute('style', preStyle)
    })

    selectorLanguage.addEventListener('change', (event: Event) => {
      const lang = (event.target as HTMLSelectElement).value
      this._selectorLanguage = lang
      this.runShiki().then(({ html, preStyle }) => {
        span.innerHTML = html
        wrapperLang.innerHTML = lang
      })
    })

    selectorTheme.addEventListener('change', (event: Event) => {
      const theme = (event.target as HTMLSelectElement).value
      this._selectorTheme = theme
      this.runShiki().then(({ html, preStyle }) => {
        span.innerHTML = html
        wrapper?.setAttribute('style', preStyle)
        selectorLanguage.setAttribute('style', preStyle)
        selectorTheme.setAttribute('style', preStyle)
      })
    })

    textarea.addEventListener('input', () => {
      this.data.code = textarea.value
      this.runShiki().then(({ html, preStyle }) => {
        span.innerHTML = html
        wrapper?.setAttribute('style', preStyle)
        selectorLanguage.setAttribute('style', preStyle)
        selectorTheme.setAttribute('style', preStyle)
      })
    })

    /**
     * Enable keydown handlers
     */
    textarea.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'Tab':
          this.tabHandler(event);
          this.data.code = textarea.value
          this.runShiki().then(({ html, preStyle }) => {
            span.innerHTML = html
          })
          break;
      }
    });

    this.nodes.textarea = textarea;

    return wrapper;
  }

  private async runShiki(): Promise<{ html: string, preStyle: string }> {
    let preStyle = ''

    const html = await codeToHtml(this.data.code, {
      lang: this._selectorLanguage,
      theme: this._selectorTheme,
      transformers: [
        {
          preprocess(code) {
            // if (code.endsWith('\n'))
              return `${code}\n`
          },
          pre(node) {
            this.addClassToHast(node, 'ce-editorjs-x-shiki__span')
            preStyle = node.properties?.style as string || ''
          },
        }
      ]
    })

    return {
      html,
      preStyle
    }

  }
}
