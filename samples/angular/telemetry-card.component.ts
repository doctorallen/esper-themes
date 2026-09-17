import { DatePipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { TelemetryReading } from './relay-telemetry.models';

@Component({
  selector: 'esper-telemetry-card',
  standalone: true,
  imports: [DatePipe, UpperCasePipe],
  templateUrl: './telemetry-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelemetryCardComponent {
  readonly reading = input.required<TelemetryReading>();
  readonly acknowledged = output<TelemetryReading>();

  readonly percentage = computed(() => `${Math.round(this.reading().value * 100)}%`);
  readonly actionLabel = computed(
    () => `Acknowledge ${this.reading().label}`,
  );

  acknowledge(): void {
    this.acknowledged.emit(this.reading());
  }
}
