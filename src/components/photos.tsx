import { Image } from 'expo-image';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAction } from '@/hooks/use-data';
import { localPhoto } from '@/local/photos';
import { colors } from '@/theme';
import { Button, Copy, Notice, Row } from './ui';

export function Photo({ path, label, compact = false }: { path: string; label: string; compact?: boolean }) {
  const source = localPhoto(path);
  if (!source) return null;
  return <Image accessible source={source} contentFit="cover" accessibilityLabel={label}
    style={[styles.photo, compact && { aspectRatio: 2 }]} />;
}

export function PhotoEditor({ paths, update }: { paths: string[]; update: (paths: string[]) => Promise<void> }) {
  const action = useAction();
  const [confirmation, setConfirmation] = useState('');

  function add() {
    void action.run(async () => {
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.65, base64: true });
      if (result.canceled) return;
      const image = result.assets[0];
      if (!image.base64) throw new Error('Não foi possível carregar a foto.');
      if (image.base64.length > 4_000_000) throw new Error('Escolha uma foto menor que 3 MB.');
      const mime = image.base64.startsWith('iVBOR') ? 'image/png'
        : image.base64.startsWith('UklG') ? 'image/webp'
        : image.base64.startsWith('/9j/') ? 'image/jpeg' : null;
      if (!mime) throw new Error('Escolha uma foto JPEG, PNG ou WebP.');
      const data = 'data:' + mime + ';base64,' + image.base64;
      if (paths.includes(data)) throw new Error('Essa foto já foi adicionada.');
      await update([...paths, data]);
    });
  }

  return <View style={{ gap: 10 }}>
    <Copy>Fotos</Copy>
    {!!action.error && <Notice error>{action.error}</Notice>}
    <Row>{paths.map((path, index) => <View key={index} style={{ width: 158, gap: 6 }}>
      <Photo path={path} label={'Foto ' + (index + 1)} />
      <Button label={confirmation === path ? 'Confirmar remoção' : 'Remover foto'} secondary
        disabled={action.busy} onPress={() => {
          if (confirmation !== path) { setConfirmation(path); return; }
          void action.run(async () => {
            await update(paths.filter((entry) => entry !== path));
            setConfirmation('');
          });
        }} />
      {confirmation === path && <Button label="Cancelar" secondary onPress={() => setConfirmation('')} />}
    </View>)}</Row>
    {paths.length < 8 && <Button label={action.busy ? 'Aguarde…' : 'Adicionar foto'} disabled={action.busy} onPress={add} />}
  </View>;
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: colors.cream },
});
