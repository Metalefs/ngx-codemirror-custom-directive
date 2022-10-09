import {
  OnInit,
  ElementRef,
  Input,
  KeyValueDiffer,
  KeyValueDiffers,
  NgZone,
  Directive,
} from '@angular/core';
import { Decoration, DecorationSet, EditorView } from "@codemirror/view"
import { CodeMirrorEditorView } from './codemirrorFactory';
import { StateEffect, StateField } from '@codemirror/state';
import { CompletionContext, CompletionSource } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

@Directive({
  selector: '[codemirrorEditor]',
})
export class CodemirrorEditorDirective implements OnInit {
  /**
   * set options for codemirror
   * @link http://codemirror.net/doc/manual.html#config
   */
  @Input()
  set options(value: { [key: string]: any }) {
    this._options = value;
    if (!this._differ && value) {
      this._differ = this._differs.find(value).create();
    }
  }
  /* preserve previous scroll position after updating value */
  @Input() enableAutoComplete: boolean = true;
  @Input() autoCompleteSource: CompletionSource;
  @Input() usePreviousWords: boolean = false;
  value = '';
  disabled = false;
  isFocused = false;
  /**
   * either global constiable or required library
   */
  private _codeMirror: any;
  editor: CodeMirrorEditorView;

  private _differ?: KeyValueDiffer<string, any>;
  private _options: any;

  constructor(
    private textArea: ElementRef,
    private _differs: KeyValueDiffers,
    private _ngZone: NgZone,
  ) {

  }

  ngOnInit(): void {
    function myCompletions(context: CompletionContext) {
      let word = context.matchBefore(/\w*/)
      if (word.from == word.to && !context.explicit)
        return null
      return {
        from: word.from,
        options: [
          {label: "f:Asd", type: "keyword"},
          {label: "hello", type: "variable", info: "(World)"},
          {label: "a:df", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"}
        ]
      }
    }

    this.editor = new CodeMirrorEditorView(this.textArea?.nativeElement, null, null, this.autoCompleteSource || myCompletions);
  }

  writeValue(value) {
    this.editor.view.state.update({ changes: [{ from: 0, to: this.editor.view.state.doc.length, insert: value }] })
  }

  onChange = (_: any) => {
    //this.changeValue.emit(this.value);
  };

  addLineClass() {

  }

  removeLineClass() {

  }

  changeValue(event) {
    this.value = event;
  }

  scrollIntoView(line) {
    //this.codemirror.codeMirror.scrollIntoView({ line, char: 5 } as any, 200)
  }

  getLineFromIndex(lineNum) {
    //this.codemirror.codeMirror.getLine(lineNum)
  }

  markText(from, to, options) {
    //this.codemirror?.codeMirror?.markText(from, to, options);
    //this.view.state.update({changes: [{from: 0, to: this.view.state.doc.length, insert: value}]})
    this.editor.view.dispatch();

    const addStyle = StateEffect.define<{ from: number, to: number }>({
      map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) })
    })

    const styleField = StateField.define<DecorationSet>({
      create() {
        return Decoration.set(styleMark.range(from, to))
      },
      update(marks, transaction) {
        marks = marks.map(transaction.changes)
        for (let e of transaction.effects) if (e.is(addStyle)) {
          marks = marks.update({
            add: [styleMark.range(e.value.from, e.value.to)]
          })
        }
        return marks
      },
      provide: f => EditorView.decorations.from(f)
    })

    const styleMark = Decoration.mark(options)
    let effects: StateEffect<unknown>[]
    if (!this.editor.view.state.field(styleField, false))
      effects.push(StateEffect.appendConfig.of([styleField]))

    this.editor.view.dispatch({ effects })
  }

}
