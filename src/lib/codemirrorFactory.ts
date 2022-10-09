import {keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
  rectangularSelection, crosshairCursor,
  lineNumbers, highlightActiveLineGutter} from "@codemirror/view"
import {EditorState, Extension} from "@codemirror/state"
import {defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
  foldGutter, foldKeymap} from "@codemirror/language"
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands"
import {searchKeymap, highlightSelectionMatches} from "@codemirror/search"
import {autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, CompletionSource, startCompletion} from "@codemirror/autocomplete"
import {lintKeymap} from "@codemirror/lint"
import {EditorView} from "@codemirror/view"


export class CodeMirrorEditorView {
  view : EditorView;
  constructor(private element: HTMLElement, private extensions: Extension[] = null, private state: EditorState = null, completionFunction?: CompletionSource){
    this.extensions = extensions ?? [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
      bracketMatching(),
      closeBrackets(),
      autocompletion({ activateOnTyping: true, override: [completionFunction]}),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      // keymap.of([{
      //   key: ":",
      //   run(e) { return startCompletion(e) }
      // }]),
      keymap.of([
        indentWithTab,
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap
      ] as any)
    ];
    this.state = state ?? EditorState.create({ extensions: this.extensions });
    this.view = new EditorView({ state: this.state, parent: this.element });
  }
}
