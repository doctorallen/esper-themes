import { DatePipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertBannerComponent } from './alert-banner.component';
import { RelayTelemetryService } from './relay-telemetry.service';
import { EMPTY_RELAY_SNAPSHOT } from './relay-telemetry.models';
import type {
  RelayChannel,
  TelemetryReading,
} from './relay-telemetry.models';
import { TelemetryCardComponent } from './telemetry-card.component';

@Component({
  selector: 'esper-relay-dashboard',
  standalone: true,
  imports: [AlertBannerComponent, DatePipe, TelemetryCardComponent, UpperCasePipe],
  templateUrl: './relay-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelayDashboardComponent {
  private readonly telemetry = inject(RelayTelemetryService);

  readonly channels: readonly RelayChannel[] = ['alpha', 'beta', 'gamma'];
  readonly relayName = signal('Neon Relay');
  readonly alertDismissed = signal(false);
  readonly snapshot = toSignal(this.telemetry.snapshots$, {
    initialValue: EMPTY_RELAY_SNAPSHOT,
  });
  readonly selectedChannel = toSignal(this.telemetry.channel$, {
    initialValue: 'beta',
  });
  readonly acknowledgementCount = toSignal(
    this.telemetry.acknowledgementCount$,
    { initialValue: 0 },
  );
  readonly lastAcknowledged = toSignal(this.telemetry.lastAcknowledged$, {
    initialValue: null,
  });

  readonly readings = computed(() => this.snapshot().readings);
  readonly lastUpdated = computed(() => this.snapshot().updatedAt);
  readonly criticalReadings = computed(() =>
    this.readings().filter(({ level }) => level === 'critical'),
  );
  readonly alertMessage = computed(() => {
    if (this.alertDismissed()) {
      return '';
    }

    const criticalCount = this.criticalReadings().length;
    return criticalCount > 0
      ? `${criticalCount} critical telemetry reading requires attention.`
      : '';
  });

  selectChannel(channel: RelayChannel): void {
    this.alertDismissed.set(false);
    this.telemetry.selectChannel(channel);
  }

  refresh(): void {
    this.alertDismissed.set(false);
    this.telemetry.refresh();
  }

  acknowledge(reading: TelemetryReading): void {
    this.alertDismissed.set(false);
    this.telemetry.acknowledge(reading);
  }

  dismissAlert(): void {
    this.alertDismissed.set(true);
  }
}
