import { router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { Page } from '@/components/layout';
import { Photo } from '@/components/photos';
import { DataState } from '@/components/resource';
import { Button, Card, Copy, Heading, Title } from '@/components/ui';
import { useData } from '@/hooks/use-data';
import { listProjectShowcase } from '@/services/store';
import { money } from '@/utils/format';

export default function CustomerProjects() {
  const data = useData(listProjectShowcase);
  const { width } = useWindowDimensions();
  const twoColumns = width >= 680;

  return <Page>
    <Heading>Projetos</Heading>

    <DataState {...data} retry={data.reload} />
    <View style={{ flexDirection: twoColumns ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
      {data.data?.map((project) => <View key={project.id} style={{ width: twoColumns ? (Math.min(width, 1120) - 44) / 2 : '100%' }}>
        <Card>
          {!!project.photo && <Photo compact path={project.photo} label={project.name} />}
          <Title>{project.name}</Title>
          {!!project.description && <Copy muted>{project.description}</Copy>}
          <Title>{money(project.price)}</Title>
          <Button label="Encomendar peça" onPress={() => router.push({
            pathname: '/encomendar', params: { projeto: project.id },
          })} />
        </Card>
      </View>)}
    </View>
    {data.data?.length === 0 && <Copy muted>Ainda não há projetos na vitrine.</Copy>}
  </Page>;
}
