import { Component, OnInit, ViewChild } from '@angular/core';
import CodeMirror from 'codemirror';
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
  'text/javascript': `const component = {
    name: "@ctrl/ngx-codemirror",
  };`,
  htmlmixed: `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
  </html>`,
  'text/css': `body {
    background-color: #fff;
    color: #222;
  }`,
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit{
  readOnly = false;
  mode: keyof typeof defaults = 'text/javascript';
  options = {
    lineNumbers: true,
    autoCloseBrackets: true,
    mode: this.mode,
    extraKeys: {"';'":"autocomplete"}
  };
  defaults = defaults;
  @ViewChild(CodemirrorEditorDirective, { static: true }) codemirror: CodemirrorEditorDirective | undefined;

  changeMode(): void {
    this.options = {
      ...this.options,
      mode: this.mode,
    };
  }

  ngOnInit() {
    this.codemirror?.writeValue(this.defaults[this.mode]);
    console.log(this.codemirror?.value)
  }

  handleChange($event): void {
    this.codemirror?.codeMirror?.markText({ line: 2, ch: 0 }, { line: 4, ch: 10 }, { className: 'bold', });
  }

  clear(): void {
    this.defaults[this.mode] = '';
  }
}
