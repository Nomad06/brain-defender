import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, subDays, eachDayOfInterval } from 'date-fns'

interface HeatmapProps {
    data: Record<string, number> // YYYY-MM-DD -> minutes
    color?: string
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
    // Generate last 365 days
    const calendarData = useMemo(() => {
        const today = new Date()
        const startDate = subDays(today, 364) // Last 52 weeks approx
        // Align start date to Sunday/Monday depending on preference. Let's start from 1 year ago.

        const days = eachDayOfInterval({ start: startDate, end: today })
        return days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const value = data[dateStr] || 0
            return {
                date,
                dateStr,
                value,
                level: getLevel(value)
            }
        })
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

    // Weeks calculation for grid
    // We need to group by week
    // But CSS grid can handle this with rows

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="min-w-[700px]">
                <div className="flex gap-1 text-xs text-sumi-gray mb-2">
                    <span className="w-8"></span> {/* Spacer for day labels */}
                    {/* Minimal logic for month labels - complex to do perfectly in grid without dedicated lib, 
                so we'll skip month labels for MVP or do safe interval */}
                    {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="flex-1 text-center">{format(subDays(new Date(), (11 - i) * 30), 'MMM')}</span>
                    ))}
                </div>

                <div className="flex gap-2">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] text-[10px] text-sumi-gray/60 leading-3 pt-[2px]">
                        <div className="h-[10px]">Mon</div>
                        <div className="h-[10px]"></div>
                        <div className="h-[10px]">Wed</div>
                        <div className="h-[10px]"></div>
                        <div className="h-[10px]">Fri</div>
                        <div className="h-[10px]"></div>
                        <div className="h-[10px]">Sun</div>
                    </div>

                    <div className="flex flex-wrap flex-col h-[94px] content-start gap-[3px]">
                        {/* 
                We use flex-col with wrap + fixed height to simulate the GitHub grid 
                7 squares * (10px + 3px gap) = ~91px. 
                Height 94px allows for 7 items.
             */}
                        {calendarData.map((day) => (
                            <motion.div
                                key={day.dateStr}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`w-[10px] h-[10px] rounded-[2px] ${getColorClass(day.level)} relative group`}
                                title={`${day.value} mins on ${format(day.date, 'MMM d, yyyy')}`}
                            >
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                    <div className="bg-sumi-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                        {day.value} mins on {format(day.date, 'MMM d')}
                                    </div>
                                </div>
                            </motion.div>
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
        </div>
    )
}

export default Heatmap
