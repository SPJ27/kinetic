'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'


const Metrics = ({
  title,
  value,
  change,
  desc,
  data,
  unit = '%',
}: MetricsProps) => {
  const gradientId = `fill-${useId().replace(/:/g, '')}`

  const latest = data.at(-1)?.usage
  const previous = data.at(-2)?.usage
  const rising =
    latest !== undefined && previous !== undefined && latest > previous

  return (
    <div className="min-w-0 overflow-hidden rounded-xs border border-neutral-200/70 bg-white p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-[13px] font-medium text-neutral-500">
          {title}
        </p>
        {change && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-neutral-600">
            {change}
          </span>
        )}
      </div>

      <h2 className="mt-1.5 truncate text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">
        {value}
      </h2>

      <div className="-mx-1 mt-4 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#404040" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#404040" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="time" hide />
            <YAxis
              hide
              domain={[
                (min: number) => Math.max(0, Math.floor(min * 0.9)),
                (max: number) => Math.ceil(max * 1.1),
              ]}
            />
            <Tooltip
              cursor={{ stroke: '#d4d4d4', strokeWidth: 1, strokeDasharray: '3 3' }}
              formatter={(v) => [`${v}${unit}`, title]}
              labelStyle={{ color: '#737373', fontSize: 11, marginBottom: 2 }}
              itemStyle={{ color: '#171717', padding: 0 }}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                fontSize: 12,
                padding: '6px 10px',
              }}
            />

            <Area
              type="monotone"
              dataKey="usage"
              stroke="#404040"
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3.5, fill: '#171717', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <p className="truncate text-xs text-neutral-500">{desc}</p>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-neutral-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${rising ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
          />
          {rising ? 'Rising' : 'Stable'}
        </span>
      </div>
    </div>
  )
}

export default Metrics