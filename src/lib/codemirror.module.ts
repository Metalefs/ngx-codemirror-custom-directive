import { NgModule } from '@angular/core';

import { CodemirrorComponent } from './codemirror.component';
import { CodemirrorEditorDirective } from './codemirror-editor.directive';

@NgModule({
  exports: [CodemirrorComponent, CodemirrorEditorDirective],
  declarations: [CodemirrorComponent, CodemirrorEditorDirective],
})
export class CodemirrorModule {}
