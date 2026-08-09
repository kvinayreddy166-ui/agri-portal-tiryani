import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCropBySlug,
  fetchCrops,
  fetchCropImages,
  searchCropKnowledge,
} from '../services/cropService';

export function useCropData(slug, options = {}) {
  const [crop, setCrop] = useState(null);
  const [crops, setCrops] = useState([]);
  const [images, setImages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cropList, cropRecord, imageList, faqList] = await Promise.all([
        fetchCrops(),
        slug ? fetchCropBySlug(slug) : Promise.resolve(null),
        slug ? fetchCropImages({ cropSlug: slug }) : Promise.resolve([]),
        slug ? searchCropKnowledge('', { cropSlug: slug, limit: options.faqLimit || 100 }) : Promise.resolve([]),
      ]);
      setCrops(cropList);
      setCrop(cropRecord);
      setImages(imageList);
      setFaqs(faqList);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [slug, options.faqLimit]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => ({
    varieties: crop?.crop_varieties || [],
    pests: crop?.crop_pests || [],
    diseases: crop?.crop_diseases || [],
    weeds: crop?.crop_weeds || [],
    fertilizers: crop?.crop_fertilizers || [],
    deficiencies: crop?.crop_deficiencies || [],
  }), [crop]);

  const search = useCallback((term, filters = {}) => {
    return searchCropKnowledge(term, { cropSlug: slug, ...filters });
  }, [slug]);

  return {
    crop,
    crops,
    cards,
    images,
    faqs,
    loading,
    error,
    reload: load,
    search,
  };
}
