import React, { useState, useEffect } from 'react';
    import SEO from '@/components/SEO';
    import ToolWrapper from '@/components/ToolWrapper';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Trash2 } from 'lucide-react';
    import { useLocalStorage } from '@/hooks/useLocalStorage';

    const HabitTrackerPage = () => {
      const [habits, setHabits] = useLocalStorage('habits', []);
      const [newHabit, setNewHabit] = useState('');

      const addHabit = () => {
        if (newHabit.trim() === '') return;
        const today = new Date().toISOString().split('T')[0];
        setHabits([...habits, { id: Date.now(), name: newHabit, completed: {}, streak: 0 }]);
        setNewHabit('');
      };

      const toggleHabit = (id) => {
        const today = new Date().toISOString().split('T')[0];
        setHabits(habits.map(habit => {
          if (habit.id === id) {
            const newCompleted = { ...habit.completed };
            newCompleted[today] = !newCompleted[today];
            return { ...habit, completed: newCompleted };
          }
          return habit;
        }));
      };

      const deleteHabit = (id) => {
        setHabits(habits.filter(habit => habit.id !== id));
      };

      useEffect(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        setHabits(habits.map(habit => {
          let currentStreak = 0;
          if (habit.completed[todayStr]) {
            currentStreak = (habit.completed[yesterdayStr] ? habit.streak : 0) + 1;
          } else if (habit.completed[yesterdayStr]) {
            currentStreak = habit.streak;
          }
          return { ...habit, streak: currentStreak };
        }));
      }, []);

      const howToUse = (
        <div>
          <p>1. Enter a new habit in the input field and click "Add".</p>
          <p>2. Your habits for the day will be listed below.</p>
          <p>3. Click the checkbox next to a habit to mark it as complete for today.</p>
          <p>4. The streak counter will automatically update based on consecutive completions.</p>
          <p>5. Click the trash icon to delete a habit permanently.</p>
        </div>
      );

      const faqSchema = {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How does the streak counter work?", "acceptedAnswer": { "@type": "Answer", "text": "The streak increases when you complete a habit on consecutive days. Missing a day resets it to zero." } },
          { "@type": "Question", "name": "Is my data saved?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, all your habits and progress are saved in your browser's local storage." } },
          { "@type": "Question", "name": "Can I track multiple habits?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, add as many habits as you want and track them all in one place." } }
        ]
      };

      return (
        <>
        <SEO path="/tools/habit-tracker" faqSchema={faqSchema} />
        <ToolWrapper title="Habit Tracker" howToUse={howToUse}>
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Habit Tracker</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="Add a new habit..."
                />
                <Button onClick={addHabit}>Add</Button>
              </div>
              <div className="space-y-2">
                {habits.map(habit => (
                  <div key={habit.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={habit.completed[new Date().toISOString().split('T')[0]] || false}
                        onCheckedChange={() => toggleHabit(habit.id)}
                      />
                      <span>{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Streak: {habit.streak}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ToolWrapper>
        </>
      );
    };

    export default HabitTrackerPage;