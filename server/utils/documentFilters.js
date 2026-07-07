export const STUDY_CATEGORY_FILTER = {
  $or: [{ category: { $exists: false } }, { category: 'study' }, { category: null }],
};

export const buildStudyDocumentQuery = (userId, resumeDocumentId = null, extraFilters = {}) => {
  const andFilters = [STUDY_CATEGORY_FILTER];

  if (resumeDocumentId) {
    andFilters.push({ _id: { $ne: resumeDocumentId } });
  }

  if (extraFilters.search) {
    andFilters.push({ originalName: { $regex: extraFilters.search, $options: 'i' } });
  }

  if (extraFilters.type && extraFilters.type !== 'All') {
    andFilters.push({
      $or: [
        { fileType: { $regex: extraFilters.type, $options: 'i' } },
        { originalName: { $regex: `\\.${extraFilters.type}$`, $options: 'i' } },
      ],
    });
  }

  return {
    userId,
    $and: andFilters,
  };
};
