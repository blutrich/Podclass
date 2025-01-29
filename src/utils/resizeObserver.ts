export const createSafeResizeObserver = (callback: ResizeObserverCallback) => {
  let frameId: number;
  let isProcessing = false;
  
  const observer = new ResizeObserver((entries) => {
    // Skip if already processing to avoid loops
    if (isProcessing) return;
    
    // Cancel any pending observations
    cancelAnimationFrame(frameId);
    
    // Schedule the callback for the next frame
    frameId = requestAnimationFrame(() => {
      try {
        isProcessing = true;
        callback(entries, observer);
      } catch (error) {
        console.error('ResizeObserver callback error:', error);
      } finally {
        isProcessing = false;
      }
    });
  });

  return {
    observe: (element: Element) => {
      try {
        observer.observe(element);
      } catch (error) {
        console.error('ResizeObserver observe error:', error);
      }
    },
    unobserve: (element: Element) => {
      try {
        observer.unobserve(element);
      } catch (error) {
        console.error('ResizeObserver unobserve error:', error);
      }
    },
    disconnect: () => {
      try {
        cancelAnimationFrame(frameId);
        observer.disconnect();
      } catch (error) {
        console.error('ResizeObserver disconnect error:', error);
      }
    }
  };
};