import {
  AfterViewInit,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  KeyValueDiffer,
  KeyValueDiffers,
  NgZone,
  OnDestroy,
  Output,
  Directive,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { Editor, EditorChange, EditorFromTextArea, ScrollInfo } from 'codemirror';
import * as CodeMirror from "codemirror";

function normalizeLineEndings(str: string): string {
  if (!str) {
    return str;
  }
  return str.replace(/\r\n|\r/g, '\n');
}


@Directive({
  selector: '[codemirrorEditor]'
})
export class CodemirrorEditorDirective implements AfterViewInit, OnDestroy, ControlValueAccessor, DoCheck {
  /* class applied to the created textarea */
  @Input() className = '';
  /* name applied to the created textarea */
  @Input() name = 'codemirror';
  /* autofocus setting applied to the created textarea */
  @Input() autoFocus = false;
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
  @Input() preserveScrollPosition = false;
  @Input() autoCompleteWords: string[] = [];
  /* called when the text cursor is moved */
  @Output() cursorActivity = new EventEmitter<Editor>();
  /* called when the editor is focused or loses focus */
  @Output() focusChange = new EventEmitter<boolean>();
  /* called when the editor is scrolled */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() scroll = new EventEmitter<ScrollInfo>();
  /* called when file(s) are dropped */
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() drop = new EventEmitter<[Editor, DragEvent]>();
  @Output() changeValue = new EventEmitter<any>();
  value = '';
  disabled = false;
  isFocused = false;
  codeMirror?: EditorFromTextArea;
  /**
   * either global variable or required library
   */
  private _codeMirror: any;

  private _differ?: KeyValueDiffer<string, any>;
  private _options: any;

  constructor(private textArea: ElementRef, private _differs: KeyValueDiffers, private _ngZone: NgZone) { }

  get codeMirrorGlobal(): any {
    if (this._codeMirror) {
      return this._codeMirror;
    }

    // in order to allow for universal rendering, we import Codemirror runtime with `require` to prevent node errors
    this._codeMirror = typeof CodeMirror !== 'undefined' ? CodeMirror : import('codemirror');
    return this._codeMirror;
  }

  ngAfterViewInit() {
    this._ngZone.runOutsideAngular(async () => {

      const codeMirrorObj = await this.codeMirrorGlobal;
      const codeMirror = codeMirrorObj?.default ? codeMirrorObj.default : codeMirrorObj;

      var editor = CodeMirror.fromTextArea(this.textArea?.nativeElement, {
        ...this._options,
        extraKeys: {"';'": "autocomplete"}
      });

      editor!.on('cursorActivity', cm => this._ngZone.run(() => this.cursorActive(cm)));
      editor!.on('scroll', this.scrollChanged.bind(this));
      editor!.on('blur', () => this._ngZone.run(() => this.focusChanged(false)));
      editor!.on('focus', () => this._ngZone.run(() => this.focusChanged(true)));
      editor!.on('change', (cm, change) =>
        this._ngZone.run(() => this.codemirrorValueChanged(cm, change)),
      );
      editor!.on('drop', (cm, e) => {
        this._ngZone.run(() => this.dropFiles(cm, e));
      });
      editor!.setValue(this.value);

      this.registerAutoComplete();

      // CodeMirror.hint.javascript = function (editor) {
      //   // Find the word fragment near cursor that needs auto-complete...
      //   const cursor = editor.getCursor();
      //   const currentLine = editor.getLine(cursor.line);
      //   let start = cursor.ch;
      //   let end = start;
      //   const rex = /[\w.]/; // a pattern to match any characters in our hint "words"
      //   // Our hints include function calls, e.g. "trap.getSource()"
      //   // so we search for word charcters (\w) and periods.
      //   // First (and optional), find end of current "word" at cursor...
      //   while (end < currentLine.length && rex.test(currentLine.charAt(end))) ++end;
      //   // Find beginning of current "word" at cursor...
      //   while (start && rex.test(currentLine.charAt(start - 1))) --start;
      //   // Grab the current word, if any...
      //   const curWord = start !== end && currentLine.slice(start, end);
      //   // Get the default results object from the JavaScript hinter...
      //   const dflt = jsHinter(editor);
      //   // If the default hinter didn't hint, create a blank result for now...
      //   const result = dflt || { list: [] };
      //   // Set the start/end of the replacement range...
      //   result.to = codeMirror.Pos(cursor.line, end);
      //   result.from = codeMirror.Pos(cursor.line, start);
      //   // Add our custom hintWords to the list, if they start with the curWord...
      //   hintWords.forEach(h => { if (h.startsWith(curWord as any)) result.list.push(h); });
      //   result.list.sort(); // sort the final list of hints
      //   return result;
      // };

      this.codeMirror = editor;
    });
  }

  ngDoCheck() {
    if (!this._differ) {
      return;
    }
    // check options have not changed
    const changes = this._differ.diff(this._options);
    if (changes) {
      changes.forEachChangedItem(option =>
        this.setOptionIfChanged(option.key, option.currentValue),
      );
      changes.forEachAddedItem(option => this.setOptionIfChanged(option.key, option.currentValue));
      changes.forEachRemovedItem(option =>
        this.setOptionIfChanged(option.key, option.currentValue),
      );
    }
  }
  ngOnDestroy() {
    // is there a lighter-weight way to remove the cm instance?
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }
  codemirrorValueChanged(cm: Editor, change: EditorChange) {
    const cmVal = cm.getValue();
    if (this.value !== cmVal) {
      this.value = cmVal;
      this.onChange(this.value);
    }
  }
  setOptionIfChanged(optionName: string, newValue: any) {
    if (!this.codeMirror) {
      return;
    }

    // cast to any to handle strictly typed option names
    // could possibly import settings strings available in the future
    this.codeMirror.setOption(optionName as any, newValue);
  }
  focusChanged(focused: boolean) {
    this.onTouched();
    this.isFocused = focused;
    this.focusChange.emit(focused);
  }
  scrollChanged(cm: Editor) {
    this.scroll.emit(cm.getScrollInfo());
  }
  cursorActive(cm: Editor) {
    this.cursorActivity.emit(cm);
  }
  dropFiles(cm: Editor, e: DragEvent) {
    this.drop.emit([cm, e]);
  }
  /** Implemented as part of ControlValueAccessor. */
  writeValue(value: string) {
    if (value === null || value === undefined) {
      return;
    }
    if (!this.codeMirror) {
      this.value = value;
      return;
    }
    const cur = this.codeMirror.getValue();
    if (value !== cur && normalizeLineEndings(cur) !== normalizeLineEndings(value)) {
      this.value = value;
      if (this.preserveScrollPosition) {
        const prevScrollPosition = this.codeMirror.getScrollInfo();
        this.codeMirror.setValue(this.value);
        this.codeMirror.scrollTo(prevScrollPosition.left, prevScrollPosition.top);
      } else {
        this.codeMirror.setValue(this.value);
      }
    }
  }

  /** Implemented as part of ControlValueAccessor. */
  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn;
  }
  /** Implemented as part of ControlValueAccessor. */
  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
  /** Implemented as part of ControlValueAccessor. */
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    this.setOptionIfChanged('readOnly', this.disabled);
  }
  /** Implemented as part of ControlValueAccessor. */
  onChange = (_: any) => {
    this.changeValue.emit(this.value);
  };
  /** Implemented as part of ControlValueAccessor. */
  private onTouched = () => { };

  registerAutoComplete(){
    var WORD = /[\w$]+/, RANGE = 500;
    var EXTRAWORDS = this.autoCompleteWords || ['true', 'false', 'null', 'undefined'];

    CodeMirror.registerHelper("hint", "anyword", function(editor, options) {
      var word = options && options.word || WORD;
      var range = options && options.range || RANGE;
      var extraWords = options && options.extraWords || EXTRAWORDS;

      var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
      var end = cur.ch, start = end;
      while (start && word.test(curLine.charAt(start - 1))) --start;
      var curWord = start != end && curLine.slice(start, end);

      var list = options && options.list || [], seen = {};
      var re = new RegExp(word.source, "g");
      for (var dir = -1; dir <= 1; dir += 2) {
        var line = cur.line, endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
        for (; line != endLine; line += dir) {
          var text = editor.getLine(line), m;
          while (m = re.exec(text)) {
            if (line == cur.line && m[0] === curWord) continue;
            if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
              seen[m[0]] = true;
              list.push(m[0]);
            }
          }
        }
      }
      list.push(...(extraWords.filter(el => el.startsWith(curWord || ''))))

      return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
    });
    CodeMirror.commands.autocomplete = function(cm) {
      cm.showHint({hint: CodeMirror.hint.anyword});
    }
  }
}
