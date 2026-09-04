import { router, useLocalSearchParams } from 'expo-router';
import PhotoPreview from '@/components/PhotoPreview';

export default function PhotoPreviewScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();

  return <PhotoPreview photoUri={photoUri} discard={() => router.back()} />;
}
