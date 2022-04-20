import { Component, ContentChild, ViewChild } from '@angular/core';
import { CodemirrorEditorDirective } from 'src/lib/codemirror-editor.directive';

const defaults = {
  markdown:
    '# Heading\n\nSome **bold** and _italic_ text\nBy [Scott Cooper](https://github.com/scttcper)',
    'text/typescript': `const component = {
    name: "@ctrl/ngx-codemirror",
    author: "Scott Cooper",
    repo: "https://github.com/scttcper/ngx-codemirror"
  };
  const hello: string = 'world';`,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  readOnly = false;
  mode: keyof typeof defaults = 'markdown';
  options = {
    lineNumbers: true,
    mode: this.mode,
  };
  defaults = defaults;
  @ViewChild(CodemirrorEditorDirective, { static: true }) codemirror: CodemirrorEditorDirective | undefined;
  constructor(
  ) {

  }

  changeMode(): void {
    this.options = {
      ...this.options,
      mode: this.mode,
    };
  }

  ngOnInit() {
    this.codemirror?.writeValue(this.defaults[this.mode]);
  }

  handleChange($event): void {
    console.log('ngModelChange', $event);
    this.codemirror?.codeMirror?.markText({ line: 3, ch: 0 }, { line: 4, ch: 10 }, { className: 'bold', });
  }

  clear(): void {
    this.defaults[this.mode] = '';
  }
}
