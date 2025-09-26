export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now - d) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - d) / (1000 * 60));
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes === 1) return '1 minute ago';
      return `${diffInMinutes} minutes ago`;
    }
    
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      if (hours === 1) return '1 hour ago';
      return `${hours} hours ago`;
    }
    
    if (diffInHours < 48) return 'Yesterday';
    
    if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      if (days === 1) return '1 day ago';
      return `${days} days ago`;
    }
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
  
  export function formatDistanceToNow(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  }