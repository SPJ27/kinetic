type DataPoint = { time: string; usage: number }

type MetricsProps = {
  title: string
  value: string
  change?: string
  desc: string
  data: DataPoint[]
  unit?: string
}
