const TIME_ZONE = 'Asia/Kuala_Lumpur';

export function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-MY', {
        timeZone: TIME_ZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatTime(value: string) {
    return new Intl.DateTimeFormat('en-MY', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(value));
}

export function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('en-MY', {
        timeZone: TIME_ZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(value));
}