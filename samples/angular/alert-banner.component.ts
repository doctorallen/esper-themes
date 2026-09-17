import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AlertSeverity = 'info' | 'warning' | 'critical';

@Component({
  selector: 'esper-alert-banner',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './alert-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertBannerComponent {
  readonly severity = input<AlertSeverity>('warning');
  readonly message = input.required<string>();
  readonly dismissed = output<void>();
}
