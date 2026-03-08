import { toPng } from 'html-to-image';

export const downloadAsImage = async (element: HTMLElement, fileName: string) => {
  try {
    // Ensure the element is visible for the capture
    const dataUrl = await toPng(element, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2, // Higher quality
    });
    
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Error downloading image:', err);
    return false;
  }
};
