/**
 * @module CX3_shared
 */


const MAGIC_IDENTIFIER = 'CX3_MAGIC'
const ICONIFY_URL = 'https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js'

const loaded = true
const uid = Date.now()

const magicPool = new Map()

/**
 * Get contrast color for better visibility from the given rgba color
 * @param {string} rgba
 * @returns string black or white
 */
const getContrastYIQ = (rgba) => {
  const [r, g, b] = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.{0,1}\d*))?\)$/).slice(1)

  var yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? 'black' : 'white';
}

/**
 * convert various date like value to Date object
 * @param {any} unknown dateLike value, number, string, Date object
 * @returns Date
 */
const convertVarious2UnixTime = (unknown) => {
  try {
    if (typeof unknown === 'number') return unknown
    if (typeof unknown === 'string' && unknown == +unknown) return +unknown
    console.log("CX3_shared.convertVarious2UnixTime : Incompatible date value", unknown)
    return new Date(unknown)?.getTime() || null
  } catch (e) {
    console.error("CX3_shared.convertVarious2UnixTime : Invalid date value", unknown, e)
    return null
  }
}

/**
 * Normalize unknown event text payload to a displayable string.
 * Handles nested objects from some calendar providers (e.g. Outlook via iCloud)
 * which may return structured objects instead of plain strings for title,
 * description, and location fields.
 * @param {any} value
 * @param {Set<object>} seen - used internally to detect circular references
 * @returns {string}
 */
const normalizeEventText = (value, seen = new Set()) => {
  if (value === null || value === undefined || value === false) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (Array.isArray(value)) {
    return value.map((v) => normalizeEventText(v, seen)).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    if (seen.has(value)) return ''
    seen.add(value)
    const preferredKeys = ['value', 'val', 'text', 'plain', 'label', 'name', 'title']
    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        return normalizeEventText(value[key], seen)
      }
    }
    if (Object.prototype.hasOwnProperty.call(value, 'params')) return ''
    const flattened = Object.values(value).map((v) => normalizeEventText(v, seen)).filter(Boolean)
    if (!flattened.length) return ''
    if (flattened.length === 1) return flattened[0]
    return flattened.join(' | ')
  }
  return ''
}

/**
 * Filter events by calendarSet
 * @param {array} events
 * @param {array} calendarSet
 * @returns array filtered events
 */
const calendarFilter = (events = [], calendarSet = []) => {
  const result = []
  for (const ev of events) {
    if (calendarSet.length === 0 || calendarSet.includes(ev.calendarName)) {
      ev.calendarSeq = calendarSet.findIndex((name) => name === ev.calendarName) + 1
      ev.duration = +ev.endDate - +ev.startDate
      result.push(ev)
    }
  }
  return result
}

/* Deprecated: kept for backward compatibility. Use direct eventPool.set(...) in module code. */
const addEventsToPool = ({ eventPool, sender, payload }) => {
  if (sender) eventPool.set(sender.identifier, structuredClone(payload))
}

/**
 * regularize events
 * @param {object}
 * @returns array of events
 */
const regularizeEvents = ({ eventPool, config }) => {
  const calendarSet = (Array.isArray(config.calendarSet)) ? [ ...config.calendarSet ] : []

  let temp = []

  for (const eventArrays of eventPool.values()) {
    temp = [...temp, ...(calendarFilter(eventArrays, calendarSet))]
  }

  if (typeof config.preProcessor === 'function') {
    // Apply custom preprocessing function to each event
    temp = temp.map(config.preProcessor)
    // Remove any null/undefined events that may have been filtered out by the preprocessor
    temp = temp.filter(ev => ev != null)
  }
  //rollback
  return temp.map((ev) => {
    ev.startDate = convertVarious2UnixTime(ev.startDate)
    ev.endDate = convertVarious2UnixTime(ev.endDate)
    /* //Unused : I forgot why I wrote this code...
    if (ev.fullDayEvent) {
      let st = new Date(+ev.startDate)
      let et = new Date(+ev.endDate)
    }
    */
    return ev
  })
}

/* DEPRECATED */
/*
  const scheduledRefresh = ({refreshTimer, refreshInterval, job}) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    refreshTimer = setTimeout(() => {
      clearTimeout(refreshTimer)
      refreshTimer = null
      job()
    }, refreshInterval)
  }
*/
/**
 * render event DOM
 * @param {object} event
 * @returns HTMLElement event DOM
 */
const renderEventDefault = (event) => {
  const e = document.createElement('div')
  e.classList.add('event')
  event.calendarName ? e.classList.add('calendar_' + encodeURI(event.calendarName)) : null
  if (event?.class) e.classList.add(event.class)
  if (event.fullDayEvent) e.classList.add('fullday')
  if (event.isPassed) e.classList.add('passed')
  if (event.isCurrent) e.classList.add('current')
  if (event.isFuture) e.classList.add('future')
  if (event.isMultiday) e.classList.add('multiday')
  if (!(event.isMultiday || event.fullDayEvent)) e.classList.add('singleday')
  e.dataset.calendarSeq = event?.calendarSeq ?? 0
  event.calendarName ? (e.dataset.calendarName = event.calendarName) : null
  e.dataset.color = event.color
  e.dataset.description = normalizeEventText(event.description)
  e.dataset.title = normalizeEventText(event.title)
  e.dataset.fullDayEvent = event.fullDayEvent
  e.dataset.geo = event.geo
  e.dataset.location = normalizeEventText(event.location)
  e.dataset.startDate = event.startDate
  e.dataset.endDate = event.endDate
  e.dataset.today = event.today
  e.dataset.symbol = event.symbol.join(' ')

  e.style.setProperty('--calendarColor', event.color)
  oppositeMagic(e, event)
  return e
}

/**
 * render symbol on event DOM
 * @param {HTMLElement} e eventDom
 * @param {object} event
 * @param {object} options
 */
const renderSymbol = (e, event, options) => {
  const { useSymbol, useIconify } = options
  const iconifyPattern = /^\S+:\S+$/
  const iconifyAltPattern = /^\S+--\S+$/
  if (useSymbol && Array.isArray(event.symbol) && event.symbol.length > 0) {
    event.symbol.forEach((symbol) => {
      const exDom = document.createElement('span')
      exDom.classList.add('symbol')
      if (symbol) {
        let iconify = symbol.match(iconifyPattern)?.[0]
        // Support alternative pattern: 'prefix--icon-name' → 'prefix:icon-name'
        if (!iconify && symbol.match(iconifyAltPattern)) {
          iconify = symbol.replace('--', ':')
        }
        if (iconify && useIconify) {
          const iconifyDom = document.createElement('iconify-icon')
          iconifyDom.icon = iconify
          iconifyDom.inline = true
          exDom.appendChild(iconifyDom)
        } else { // fontawesome
          const faDom = document.createElement('span')
          faDom.className = symbol
          exDom.appendChild(faDom)
        }
        e.classList.add('useSymbol')
      } else {
        exDom.classList.add('noSymbol')
      }
      e.appendChild(exDom)
    })
  } else {
    const exDom = document.createElement('span')
    exDom.classList.add('noSymbol', 'symbol')
    e.appendChild(exDom)
  }
}
/**
 * render event DOM
 * @param {object} event
 * @param {object} options
 * @returns HTMLElement event DOM
 */
const renderEvent = (event, options) => {
  const e = renderEventDefault(event)
  renderSymbol(e, event, options)

  const t = document.createElement('span')
  t.classList.add('title', 'eventTitle')
  t.textContent = normalizeEventText(event.title)
  e.appendChild(t)
  return e
}

/**
 * render event DOM for journal
 * @param {object} event
 * @param {object} options
 * @returns
 */
const renderEventJournal = (event, { useSymbol, eventTimeOptions, eventDateOptions, locale, useIconify }) => {
  const e = renderEventDefault(event)

  const headline = document.createElement('div')
  headline.classList.add('headline')
  renderSymbol(headline, event, { useSymbol, useIconify })

  const title = document.createElement('div')
  title.classList.add('title')
  title.textContent = normalizeEventText(event.title)
  headline.appendChild(title)
  e.appendChild(headline)


  const time = document.createElement('div')
  time.classList.add('period')

  const period = document.createElement('div')
  const st = new Date(+event.startDate)
  const et = new Date(+event.endDate)
  const inday = (et.getDate() === st.getDate() && et.getMonth() === st.getMonth() && et.getFullYear() === st.getFullYear())
  period.classList.add('time', (inday) ? 'inDay' : 'notInDay')
  period.innerHTML = new Intl.DateTimeFormat(locale, (inday) ? eventTimeOptions : { ...eventDateOptions, ...eventTimeOptions }).formatRangeToParts(st, et)
  .reduce((prev, cur, curIndex) => {
    prev = prev + `<span class="eventTimeParts ${cur.type} seq_${curIndex}">${cur.value}</span>`
    return prev
  }, '')
  e.appendChild(period)


  const description = document.createElement('div')
  description.classList.add('description')
  description.textContent = normalizeEventText(event.description)
  e.appendChild(description)
  const location = document.createElement('div')
  location.classList.add('location')
  location.textContent = normalizeEventText(event.location)
  e.appendChild(location)

  return e
}

/**
 * render event DOM for agenda
 * @param {object} event
 * @param {object} options
 * @param {Date} tm
 * @returns HTMLElement event DOM
 */
const renderEventAgenda = (event, {useSymbol, eventTimeOptions, locale, useIconify, showMultidayEventsOnce, multidayRangeLabelOptions}, tm = new Date())=> {
  const e = renderEventDefault(event)

  const headline = document.createElement('div')
  headline.classList.add('headline')
  renderSymbol(headline, event, { useSymbol, useIconify })

  if (showMultidayEventsOnce && event.isMultiday) {
    const rangeOptions = multidayRangeLabelOptions ?? { month: 'short', day: 'numeric' }
    const dateFmt = new Intl.DateTimeFormat(locale, rangeOptions)
    const timeFmt = new Intl.DateTimeFormat(locale, eventTimeOptions)
    const st = new Date(+event.startDate)
    const et = new Date(+event.endDate)

    const formatParts = (fmt, d, prefix) => fmt.formatToParts(d).reduce((prev, cur, curIndex) => {
      return prev + `<span class="eventTimeParts ${cur.type} seq_${prefix}_${curIndex}">${cur.value}</span>`
    }, '')

    // Use startTime/endTime classes so existing ::after CSS separator applies automatically.
    const startDateEl = document.createElement('div')
    startDateEl.classList.add('time', 'startTime', 'inDay')
    startDateEl.innerHTML = event.isFullday
      ? formatParts(dateFmt, st, 'sd')
      : formatParts(dateFmt, st, 'sd') + ' ' + formatParts(timeFmt, st, 'st')
    headline.appendChild(startDateEl)

    const endDateEl = document.createElement('div')
    endDateEl.classList.add('time', 'endTime', 'inDay')
    endDateEl.innerHTML = event.isFullday
      ? formatParts(dateFmt, et, 'ed')
      : formatParts(dateFmt, et, 'ed') + ' ' + formatParts(timeFmt, et, 'et')
    headline.appendChild(endDateEl)
  } else if (!event.isFullday) {
    // Timed single-day events: show start/end times relative to the displayed day.
    const startTime = document.createElement('div')
    const st = new Date(+event.startDate)
    startTime.classList.add('time', 'startTime', (st.getDate() === tm.getDate()) ? 'inDay' : 'notInDay')
    startTime.innerHTML = new Intl.DateTimeFormat(locale, eventTimeOptions).formatToParts(st).reduce((prev, cur, curIndex) => {
      prev = prev + `<span class="eventTimeParts ${cur.type} seq_${curIndex}">${cur.value}</span>`
      return prev
    }, '')
    headline.appendChild(startTime)

    const endTime = document.createElement('div')
    const et = new Date(+event.endDate)
    endTime.classList.add('time', 'endTime', (et.getDate() === tm.getDate()) ? 'inDay' : 'notInDay')
    endTime.innerHTML = new Intl.DateTimeFormat(locale, eventTimeOptions).formatToParts(et).reduce((prev, cur, curIndex) => {
      prev = prev + `<span class="eventTimeParts ${cur.type} seq_${curIndex}">${cur.value}</span>`
      return prev
    }, '')
    headline.appendChild(endTime)
  }
  // Fullday single-day events: no time shown (startDate is always midnight).

  const title = document.createElement('div')
  title.classList.add('title')
  title.textContent = normalizeEventText(event.title)
  headline.appendChild(title)
  e.appendChild(headline)
  const description = document.createElement('div')
  description.classList.add('description')
  description.textContent = normalizeEventText(event.description)
  e.appendChild(description)
  const location = document.createElement('div')
  location.classList.add('location')
  location.textContent = normalizeEventText(event.location)
  e.appendChild(location)

  return e
}

/**
 * set opposite color to event DOM
 * @param {HTMLElement} e
 * @param {object} original event
 */
const oppositeMagic = (e, original) => {
  if (magicPool.has(original.color)) {
    original.oppositeColor = magicPool.get(original.color)
  } else {
    const magic = prepareMagic()
    magic.style.color = original.color
    const oppositeColor = getContrastYIQ(window.getComputedStyle(magic).getPropertyValue('color'))
    original.oppositeColor = oppositeColor;
  }
  e.style.setProperty('--oppositeColor', original.oppositeColor)
}

/**
 * format events before serve
 * @param {object}
 * @returns array of events
 */
const formatEvents = ({ original, config }) => {
  const simpleHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash &= hash // Convert to 32bit integer
    }
    return (hash >>> 0).toString(36)
  }

  const duplicateSet = new Set()

  const thisMoment = new Date()

  let events = original.map((ev) => {
    ev.startDate = +ev.startDate
    ev.endDate = +ev.endDate
    ev.isPassed = isPassed(ev)
    ev.isCurrent = isCurrent(ev)
    ev.isFuture = isFuture(ev)
    ev.isFullday = ev.fullDayEvent
    if (ev.isFullday) {
      const gap = +ev.endDate - +ev.startDate
      if (gap % (1000 * 60 * 60 * 24) === 0) {
        ev.startDate = new Date(+ev.startDate).setHours(0, 0, 0, 0)
        ev.endDate = new Date(+ev.startDate + gap).valueOf()
      }
    }
    const et = new Date(+ev.endDate)
    if (et.getHours() === 0 && et.getMinutes() === 0 && et.getSeconds() === 0 && et.getMilliseconds() === 0) ev.endDate = ev.endDate - 1
    ev.isMultiday = isMultiday(ev)
    ev.today = thisMoment.toLocaleDateString("en-CA") === new Date(+ev.startDate).toLocaleDateString("en-CA")
    ev.hash = simpleHash(ev.title + ev.startDate + ev.endDate)
    return ev
  }).toSorted((a, b) => {
    return (a.startDate === b.startDate) ? ((a.endDate === b.endDate) ? a.calendarSeq - b.calendarSeq : b.endDate - a.endDate) : a.startDate - b.startDate
  })



  if (typeof config.eventFilter === 'function') {
    events = events.filter(config.eventFilter)
  }
  if (typeof config.eventTransformer === 'function') {
    events = events.map(config.eventTransformer)
  }
  if (typeof config.eventSorter === 'function') {
    events = events.toSorted(config.eventSorter)
  }

  for (const ev of events) {
    if (config.skipDuplicated && duplicateSet.has(ev.hash)) {
      ev.skip = true
      ev.duplicated = true
    }
    duplicateSet.add(ev.hash)
  }

  return events
}

/**
 * return formatted events in the given range
 * @param {object}
 * @returns array of events
 */
const prepareEvents = ({ targetEvents, config, range }) => {
  const events = targetEvents.filter((evs) => {
    return !(evs.endDate <= range[0] || evs.startDate >= range[1])
  })

  return formatEvents({original: events, config})
}

/**
 * return events by date
 * @param {object}
 * @returns array of events
 */
// TO_CHECK : Should it be deprecated??
const eventsByDate = ({ targetEvents, config, startTime, dayCounts }) => {
  const events = formatEvents({ original: targetEvents, config })
  const ebd = events.reduce((days, ev) => {
    if (ev.endDate < startTime) return days
    const st = new Date(+ev.startDate)
    const et = new Date(+ev.endDate)

    while(st.getTime() <= et.getTime()) {
      const day = new Date(st.getFullYear(), st.getMonth(), st.getDate(), 0, 0, 0, 0).getTime()
      if (!days.has(day)) days.set(day, [])
      days.get(day).push(ev)
      st.setDate(st.getDate() + 1)
    }
    return days
  }, new Map())

  const startDay = new Date(+startTime).setHours(0, 0, 0, 0)
  const days = Array.from(ebd.keys()).sort()
  const position = days.findIndex((d) => d >= startDay)

  return days.slice(position, position + dayCounts).map((d) => {
    return {
      date: d,
      events: ebd.get(d)
    }
  })
}
/**
 * Prepare magic DOM for color contrast calculation
 * @returns HTMLElement magic DOM
 */
const prepareMagic = () => {
  let magic = document.getElementById(MAGIC_IDENTIFIER)
  if (!magic) {
    magic = document.createElement('div')
    magic.id = MAGIC_IDENTIFIER
    magic.style.display = 'none'
    document.body.appendChild(magic)
  }
  return magic
}

/**
 * Prepare iconify
 */
const prepareIconify = () => {
  // if iconify is not loaded, load it.
  if (!window.customElements.get('iconify-icon') && !document.getElementById('iconify')) {
    const iconify = document.createElement('script')
    iconify.id = 'iconify'
    iconify.src = ICONIFY_URL
    document.head.appendChild(iconify)
  }
}

/* DEPRECATED */
/*
const initModule = (m, language) => {
  m.refreshTimer = null
  m.eventPool = new Map()
}
*/

/**
 * append legend to the given DOM
 * @param {HTMLElement} dom
 * @param {array} events
 * @param {object} options
 */
const displayLegend = (dom, events, options = {}) => {
  const lDom = document.createElement('div')
  lDom.classList.add('legends')
  const legendData = new Map()
  for (const ev of events) {
    if (!legendData.has(ev.calendarName)) legendData.set(ev.calendarName, {
      name: ev.calendarName,
      color: ev.color ?? null,
      oppositeColor: ev.oppositeColor,
      symbol: ev.symbol ?? []
    })
  }
  for (const l of legendData.values()) {
    const ld = document.createElement('div')
    ld.classList.add('legend')
    renderSymbol(ld, l, options)
    const t = document.createElement('span')
    t.classList.add('title')
    t.innerHTML = l.name
    ld.appendChild(t)
    ld.style.setProperty('--calendarColor', l.color)
    ld.style.setProperty('--oppositeColor', l.oppositeColor)
    lDom.appendChild(ld)
  }
  dom.appendChild(lDom)
}

/**
 * is today
 * @param {Date} d
 * @returns boolean true if the given date is today
 */
const isToday = (d) => {
  const tm = new Date()
  const start = (new Date(tm.getTime())).setHours(0, 0, 0, 0)
  const end = (new Date(tm.getTime())).setHours(23, 59, 59, 999)
  return (d.getTime() >= start && d.getTime() <= end)
}

/**
 * is before today
 * @param {Date} d
 * @returns boolean true if the given date is before today
 */
const isPastDay = (d) => {
  const tm = new Date()
  const start = (new Date(tm.getTime())).setHours(0, 0, 0, 0)
  return d.getTime() < start
}

/**
 * is after today
 * @param {Date} d
 * @returns boolean true if the given date is after today
 */
const isFutureDay = (d) => {
  const tm = new Date()
  const end = (new Date(tm.getTime())).setHours(23, 59, 59, 999)
  return d.getTime() > end
}

/**
 * is this month
 * @param {Date} d
 * @returns boolean true if the given date is this month
 */
const isThisMonth = (d) => {
  const tm = new Date()
  const start = new Date(tm.getFullYear(), tm.getMonth(), 1)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
  return (d.getTime() >= start && d.getTime() <= end)
}

/**
 * is this year
 * @param {Date} d
 * @returns boolean true if the given date is this year
 */
const isThisYear = (d) => {
  const tm = new Date()
  const start = new Date(tm.getFullYear(), 1, 1)
  const end = new Date(tm.getFullYear(), 11, 31, 23, 59, 59, 999)
  return (d.getTime() >= start && d.getTime() <= end)
}

/**
 * Get weekend index from options.weekends array
 * @param {Date} d
 * @param {object} options
 * @returns integer -1: not found, 0: the first weekend, 1: the second weekend, ...
 */
const isWeekend = (d, options) => {
  return (options.weekends.findIndex(w => w === d.getDay()))
}

/**
 * Get begin of week
 * @param {Date} d
 * @param {object} options
 * @returns Date begin of week
 */
const getBeginOfWeek = (d, options) => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() - options.firstDayOfWeek + 7 ) % 7, 0, 0, 0, 0)
}

/**
 * Get end of week
 * @param {Date} d
 * @param {object} options
 * @returns Date end of week
 */
const getEndOfWeek = (d, options) => {
  const b = getBeginOfWeek(d, options)
  return new Date(b.getFullYear(), b.getMonth(), b.getDate() + 6, 23, 59, 59, 999)
}

/**
 * Get week number of the year
 * @param {Date} d date object
 * @param {Object} options { minimalDaysOfNewYear, firstDayOfWeek }
 * @returns integer week number of the year
 */
const getWeekNo = (d, options) => {
  const bow = getBeginOfWeek(d, options)
  let fw = getBeginOfWeek(new Date(d.getFullYear(), 0, options.minimalDaysOfNewYear), options)
  const nfw = getBeginOfWeek(new Date(d.getFullYear() + 1, 0, options.minimalDaysOfNewYear), options)
  if (bow.getTime() < fw.getTime()) fw = getBeginOfWeek(new Date(d.getFullYear() - 1, 0, options.minimalDayosOfNewYear), options)
  let count = 1
  if (bow.getTime() === nfw.getTime()) return count
  const t = new Date(fw.getTime())
  while (bow.getTime() > t.getTime()) {
    t.setDate(t.getDate() + 7)
    count++;
  }
  return count
}

/**
 *  Check if the event is passed
 * @param {Object} ev event object
 * @returns boolean true if the event is passed
 */
const isPassed = (ev) => {
  return (ev.endDate < Date.now())
}

/**
 * Check if the event is future
 * @param {Object} ev event object
 * @returns boolean true if the event is future
 */
const isFuture = (ev) => {
  return (ev.startDate > Date.now())
}

/**
 * Check if the event is current
 * @param {Object} ev event object
 * @returns boolean true if the event is current
 */
const isCurrent = (ev) => {
  const tm = Date.now()
  return (ev.endDate >= tm && ev.startDate <= tm)
}

/**
 * Check if the event is multiday
 * @param {Object} ev event object
 * @returns boolean true if the event is multiday
 */
const isMultiday = (ev) => {
  const s = new Date(+ev.startDate)
  const e = new Date(+ev.endDate)
  return ((s.getDate() !== e.getDate())
    || (s.getMonth() !== e.getMonth())
    || (s.getFullYear() !== e.getFullYear()))
}
/**
 *  Get relative date object from the given date
 * @param {Date} d
 * @param {*} gap
 * @returns Date new date object
 */
const getRelativeDate = (d, gap) => {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + gap)
}

/**
 * Get difference from today
 * @param {Date} d
 * @returns integer gap from today
 */
const gapFromToday = (d) => {
  const MS = 24 * 60 * 60 * 1000
  const t = new Date()
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / MS)
}

/**
 * Make weather DOM and append it to parent DOM
 * @param {HTMLElement} parentDom
 * @param {Object} forecasted
 * @returns HTMLElement weather DOM
 */
const makeWeatherDOM = (parentDom, forecasted) => {
  if (forecasted && forecasted?.weatherType) {
    const weatherDom = document.createElement('div')
    weatherDom.classList.add('cellWeather')
    const icon = document.createElement('span')
    icon.classList.add('wi', 'wi-' + forecasted.weatherType)
    weatherDom.appendChild(icon)
    const maxTemp = document.createElement('span')
    maxTemp.classList.add('maxTemp', 'temperature')
    maxTemp.innerHTML = Math.round(forecasted.maxTemperature)
    weatherDom.appendChild(maxTemp)
    const minTemp = document.createElement('span')
    minTemp.classList.add('minTemp', 'temperature')
    minTemp.innerHTML = Math.round(forecasted.minTemperature)
    weatherDom.appendChild(minTemp)
    parentDom.appendChild(weatherDom)
  }
  return parentDom
}


export {
  uid,
  loaded,
  //initModule,
  prepareIconify,
  regularizeEvents,
  calendarFilter,
  addEventsToPool,
  //scheduledRefresh,
  prepareEvents,
  eventsByDate,
  renderEvent,
  renderEventAgenda,
  renderEventJournal,
  renderSymbol,
  prepareMagic,
  displayLegend,
  isToday,
  isPastDay,
  isFutureDay,
  isThisMonth,
  isThisYear,
  isWeekend,
  getBeginOfWeek,
  getEndOfWeek,
  getWeekNo,
  isPassed,
  isFuture,
  isCurrent,
  isMultiday,
  getRelativeDate,
  gapFromToday,
  makeWeatherDOM
}
