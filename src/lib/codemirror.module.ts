import { NgModule } from '@angular/core';

import { CodemirrorEditorDirective } from './codemirror-editor.directive';

@NgModule({
  exports: [CodemirrorEditorDirective],
  declarations: [CodemirrorEditorDirective],
})
export class CodemirrorModule {}
