import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Select } from '@/components/form';
import { Page } from '@/components/layout';
import { DataState } from '@/components/resource';
import { Button, Card, Copy, Heading, Notice, Title, fonts } from '@/components/ui';
import { clockLabel, elapsedMs, hourlyRate, workCost } from '@/domain/work-time';
import { useAction, useData } from '@/hooks/use-data';
import { getWork, pauseWork, startWork } from '@/services/work';
import { colors } from '@/theme';
import { dateLabel, money } from '@/utils/format';

const ClockRing = memo(function ClockRing({ running }: { running: boolean }) {
  const [{ phase, rotation }] = useState(() => {
    const phase = new Animated.Value(0);
    return { phase, rotation: phase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) };
  });

  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(Animated.timing(phase, {
      toValue: 1,
      duration: 3200,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }));
    loop.start();
    return () => {
      loop.stop();
      phase.setValue(0);
    };
  }, [running, phase]);

  return <Animated.View style={[styles.ring, running && styles.activeRing, { transform: [{ rotate: rotation }] }]} />;
});

function Clock({ startedAt, previousDuration }: { startedAt?: number; previousDuration: number }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (startedAt === undefined) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [startedAt]);

  const elapsed = startedAt === undefined ? previousDuration : elapsedMs(startedAt, now);
  return <View style={styles.clock}>
    <ClockRing running={startedAt !== undefined} />
    <Ionicons name="timer-outline" size={23} color={colors.accent} />
    <Text accessibilityLabel="Tempo da sessão" style={styles.time}>{clockLabel(elapsed)}</Text>
    <Copy muted>{money(workCost(elapsed))}</Copy>
  </View>;
}

export default function WorkTimer() {
  const { projeto } = useLocalSearchParams<{ projeto?: string }>();
  const [choice, setChoice] = useState(typeof projeto === 'string' ? projeto : '');
  const data = useData(getWork);
  const action = useAction();
  const active = data.data?.active;
  const projects = data.data?.projects ?? [];
  const options = projects.filter((project) => project.canStart).map(({ id, name }) => ({ value: id, label: name }));
  const selectedId = active?.projectId ?? (projects.some((project) => project.id === choice) ? choice : options[0]?.value ?? '');
  const project = projects.find(({ id }) => id === selectedId);
  const recent = data.data?.sessions.filter((session) => session.projectId === project?.id).slice(-5).reverse() ?? [];
  const last = recent[0];
  const previousDuration = last ? elapsedMs(last.startedAt, last.endedAt) : 0;

  return <Page narrow>
    <Heading>Crochetar</Heading>
    <DataState {...data} retry={data.reload} />
    {!!action.error && <Notice error>{action.error}</Notice>}
    {!!action.success && <Notice>{action.success}</Notice>}
    {data.data && <Card>
      {active ? <Title>{project?.name ?? 'Projeto em andamento'}</Title>
        : <Select label="Projeto" options={options} value={selectedId} onChange={setChoice} />}
      <Clock key={active?.startedAt ?? 'stopped'} startedAt={active?.startedAt} previousDuration={previousDuration} />
      <Copy muted>{money(hourlyRate)} por hora · {active ? 'Cronômetro em execução' : last ? 'Última sessão registrada' : 'Cronômetro pausado'}</Copy>
      {active ? <Button label="Pausar e registrar tempo" disabled={action.busy}
        onPress={() => void action.run(async () => {
          await pauseWork(active.startedAt);
          setChoice(active.projectId);
          data.reload();
        }, 'Tempo registrado no projeto.')} /> :
        <Button label="Iniciar cronômetro" disabled={action.busy || !project?.canStart}
          onPress={() => void action.run(async () => { await startWork(selectedId); data.reload(); })} />}
    </Card>}
    {project && <Card>
      <Title>Resumo de {project.name}</Title>
      <Copy>Tempo registrado {clockLabel(project.milliseconds)}</Copy>
      <Copy>Mão de obra {money(project.labor)} · Sessões {project.periods}</Copy>
      {recent.length > 0 && <>
        <Title>Sessões recentes</Title>
        {recent.map((session) => <Copy key={session.startedAt}>
          {dateLabel(new Date(session.startedAt).toISOString())} · {clockLabel(elapsedMs(session.startedAt, session.endedAt))}
        </Copy>)}
      </>}
    </Card>}
  </Page>;
}

const styles = StyleSheet.create({
  clock: { width: 210, height: 210, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', gap: 8, marginVertical: 8 },
  ring: { position: 'absolute', height: 210, width: 210, borderRadius: 105, borderWidth: 7, borderColor: colors.cream },
  activeRing: { borderTopColor: colors.accent, borderRightColor: colors.sageInk },
  time: { fontFamily: fonts.strong, fontSize: 37, color: colors.ink, fontVariant: ['tabular-nums'] },
});
