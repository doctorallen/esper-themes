<?php

declare(strict_types=1);

namespace Esper\Themes;

use DateTimeImmutable;
use InvalidArgumentException;

enum SignalLevel: string
{
    case Nominal = 'nominal';
    case Warning = 'warning';
    case Critical = 'critical';
}

#[\Attribute(\Attribute::TARGET_CLASS)]
final class Audited
{
    public function __construct(public readonly string $channel) {}
}

#[Audited(channel: 'relay-status')]
final class RelayReport
{
    /** @var list<float> */
    private array $samples = [];

    public function __construct(
        public readonly string $source,
        public readonly DateTimeImmutable $createdAt = new DateTimeImmutable(),
    ) {}

    public function addSample(float $strength): void
    {
        if ($strength < 0.0 || $strength > 1.0) {
            throw new InvalidArgumentException("Invalid strength: {$strength}");
        }

        $this->samples[] = $strength;
    }

    public function level(): SignalLevel
    {
        $average = array_sum($this->samples) / max(1, count($this->samples));

        return match (true) {
            $average >= 0.9 => SignalLevel::Critical,
            $average >= 0.7 => SignalLevel::Warning,
            default => SignalLevel::Nominal,
        };
    }
}

$report = new RelayReport('neon-relay');
array_map($report->addSample(...), [0.72, 0.84, 0.96]);
echo "{$report->source}: {$report->level()->value}", PHP_EOL;
