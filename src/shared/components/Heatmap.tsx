import React, { useMemo } from 'react'

import { format, subDays, eachDayOfInterval, startOfWeek } from 'date-fns'

interface HeatmapProps {
    data: Record<string, number> // YYYY-MM-DD -> minutes
    color?: string
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
    const [hoveredDay, setHoveredDay] = React.useState<{
        value: number
        dateStr: string
        formattedDate: string
        x: number
        y: number
    } | null>(null)

    // Generate calendar data grouped by weeks
    const { weeks, monthLabels } = useMemo(() => {
        const today = new Date()
        // Ensure start date is a Monday
        const startDate = startOfWeek(subDays(today, 364), { weekStartsOn: 1 })

        const days = eachDayOfInterval({ start: startDate, end: today })

        // Enhance days with data
        const enhancedDays = days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const value = data[dateStr] || 0
            return {
                date,
                dateStr,
                value,
                level: getLevel(value)
            }
        })

        // Chunk into weeks
        const weeksArray: typeof enhancedDays[] = []
        let currentWeek: typeof enhancedDays = []

        enhancedDays.forEach((day) => {
            currentWeek.push(day)
            if (currentWeek.length === 7) {
                weeksArray.push(currentWeek)
                currentWeek = []
            }
        })
        // Push last partial week if exists
        if (currentWeek.length > 0) {
            weeksArray.push(currentWeek)
        }

        // Calculate month labels
        const labels: { weekIndex: number, label: string }[] = []
        let lastMonth = ''

        weeksArray.forEach((week, index) => {
            const firstDay = week[0].date
            const monthStr = format(firstDay, 'MMM')

            if (monthStr !== lastMonth) {
                labels.push({ weekIndex: index, label: monthStr })
                lastMonth = monthStr
            }
        })

        return { weeks: weeksArray, monthLabels: labels }
    }, [data])

    function getLevel(minutes: number) {
        if (minutes === 0) return 0
        if (minutes < 15) return 1
        if (minutes < 30) return 2
        if (minutes < 60) return 3
        return 4 // Intense focus
    }

    const getColorClass = (level: number) => {
        switch (level) {
            case 0: return 'bg-sumi-gray/10'
            case 1: return 'bg-accent/30'
            case 2: return 'bg-accent/50'
            case 3: return 'bg-accent/70'
            case 4: return 'bg-accent'
            default: return 'bg-sumi-gray/10'
        }
    }

    return (
        <div className="w-full overflow-x-auto pb-4 relative">
            <div className="min-w-fit pr-4">
                {/* Month Labels Row */}
                <div className="flex gap-[3px] text-xs text-sumi-gray mb-2 ml-8 pl-0.5">
                    {weeks.map((_, index) => {
                        const labelObj = monthLabels.find(l => l.weekIndex === index)
                        return (
                            <div key={index} className="w-[10px] flex-none relative">
                                {labelObj && (
                                    <span className="absolute left-0 bottom-0 whitespace-nowrap">
                                        {labelObj.label}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex gap-2">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] text-[10px] text-sumi-gray/60 pt-[0px] w-8 text-right pr-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={i} className="h-[10px] leading-[10px]">{day}</div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex gap-[3px]" onMouseLeave={() => setHoveredDay(null)}>
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px] w-[10px]">
                                {week.map((day) => (
                                    <div
                                        key={day.dateStr}
                                        className={`w-[10px] h-[10px] rounded-[2px] ${getColorClass(day.level)} transition-all duration-200 hover:scale-125 hover:z-10 cursor-default`}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            // Calculate position relative to the scrollable container or handling it fixed?
                                            // A simple way is to use fixed position for tooltip or relative to the parent.
                                            // Let's rely on standard mouse enter and use fixed/absolute positioning logic.
                                            // Actually, simplest is to use the rect coordinates.
                                            setHoveredDay({
                                                value: day.value,
                                                dateStr: day.dateStr,
                                                formattedDate: format(day.date, 'MMM d'),
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            })
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-sumi-gray mt-4 justify-end">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-sumi-gray/10"></div>
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-accent/30"></div>
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-accent/50"></div>
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-accent/70"></div>
                        <div className="w-[10px] h-[10px] rounded-[2px] bg-accent"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>

            {/* Shared Tooltip Portal/Overlay */}
            {hoveredDay && (
                <div
                    className="fixed z-50 pointer-events-none fade-in"
                    style={{
                        left: hoveredDay.x,
                        top: hoveredDay.y,
                        transform: 'translate(-50%, -120%)'
                    }}
                >
                    <div className="bg-sumi-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap mb-2">
                        {hoveredDay.value} mins on {hoveredDay.formattedDate}
                        {/* Little arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-sumi-black"></div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Heatmap
