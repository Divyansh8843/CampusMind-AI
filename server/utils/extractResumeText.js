const MAX_CHARS = 100000;

export const extractTextFromBuffer = async (file = {}) => {
  if (!file?.buffer?.length) return '';

  const lowerName = (file.originalname || '').toLowerCase();
  const mimetype = file.mimetype || '';

  if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    try {
      const pdfParse = (await import('./pdf-wrapper.cjs')).default;
      const data = await pdfParse(file.buffer);
      return (data.text || '').slice(0, MAX_CHARS);
    } catch (error) {
      console.error('PDF extraction failed:', error.message);
      return '';
    }
  }

  if (
    mimetype.startsWith('text/') ||
    ['.txt', '.md', '.csv', '.json'].some((ext) => lowerName.endsWith(ext))
  ) {
    return file.buffer.toString('utf8').slice(0, MAX_CHARS);
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    return '';
  }

  return '';
};
