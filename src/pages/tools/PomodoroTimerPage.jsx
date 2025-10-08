import React, { useState, useEffect, useRef } from 'react';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';

    const PomodoroTimerPage = () => {
      const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
      const [time, setTime] = useState(25 * 60);
      const [isActive, setIsActive] = useState(false);
      const [sessions, setSessions] = useState(0);
      const intervalRef = useRef(null);

      const times = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };

      useEffect(() => {
        if (isActive) {
          intervalRef.current = setInterval(() => {
            setTime(prev => prev - 1);
          }, 1000);
        } else {
          clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
      }, [isActive]);

      useEffect(() => {
        if (time === 0) {
          clearInterval(intervalRef.current);
          setIsActive(false);
          if (Notification.permission === "granted") {
            new Notification(`Pomodoro: ${mode === 'work' ? 'Work' : 'Break'} session ended!`);
          }
          if (mode === 'work') {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            switchMode(newSessions % 4 === 0 ? 'longBreak' : 'shortBreak');
          } else {
            switchMode('work');
          }
        }
      }, [time]);

      useEffect(() => {
        if (Notification.permission !== "granted") {
          Notification.requestPermission();
        }
      }, []);

      const switchMode = (newMode) => {
        setMode(newMode);
        setTime(times[newMode]);
        setIsActive(false);
      };

      const toggleTimer = () => setIsActive(!isActive);
      const resetTimer = () => switchMode(mode);

      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      };

      const progress = (1 - time / times[mode]) * 100;

      const howToUse = (
        <div>
          <p>1. Choose a mode: "Work" (25 mins), "Short Break" (5 mins), or "Long Break" (15 mins).</p>
          <p>2. Click "Start" to begin the countdown.</p>
          <p>3. The timer will run, and you'll receive a browser notification when the session ends.</p>
          <p>4. The timer automatically cycles between work and break sessions.</p>
          <p>5. Use "Pause" to temporarily stop the timer and "Reset" to restart the current session.</p>
        </div>
      );

      return (
        <ToolWrapper title="Pomodoro Timer" howToUse={howToUse}>
          <Card className="max-w-md mx-auto">
            <CardHeader><CardTitle>Pomodoro Timer</CardTitle></CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex justify-center gap-2">
                <Button variant={mode === 'work' ? 'default' : 'outline'} onClick={() => switchMode('work')}>Work</Button>
                <Button variant={mode === 'shortBreak' ? 'default' : 'outline'} onClick={() => switchMode('shortBreak')}>Short Break</Button>
                <Button variant={mode === 'longBreak' ? 'default' : 'outline'} onClick={() => switchMode('longBreak')}>Long Break</Button>
              </div>
              <div className="text-8xl font-bold">{formatTime(time)}</div>
              <Progress value={progress} />
              <div className="flex justify-center gap-4">
                <Button onClick={toggleTimer} size="lg">{isActive ? 'Pause' : 'Start'}</Button>
                <Button onClick={resetTimer} size="lg" variant="outline">Reset</Button>
              </div>
              <p className="text-muted-foreground">Completed sessions: {sessions}</p>
            </CardContent>
          </Card>
        </ToolWrapper>
      );
    };

    export default PomodoroTimerPage;