import React, { useState, useEffect } from 'react';
    import { useParams, Link, useLocation } from 'react-router-dom';
    import { useLocalStorage } from '@/hooks/useLocalStorage';
    import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { BarChart2 } from 'lucide-react';
    import AnimatedLogo from '@/components/AnimatedLogo';
    import { supabase } from '@/lib/customSupabaseClient';

    const PollVotePage = () => {
      const { pollId } = useParams();
      const location = useLocation();
      const [poll, setPoll] = useState(null);
      const [votes, setVotes] = useState({});
      const [totalVotes, setTotalVotes] = useState(0);
      const [selectedOption, setSelectedOption] = useState(null);
      const [selectedOptions, setSelectedOptions] = useState([]);
      const [hasVoted, setHasVoted] = useLocalStorage(`voted_${pollId}`, false);
      const [isLoading, setIsLoading] = useState(true);
      const { toast } = useToast();

      useEffect(() => {
        try {
          const searchParams = new URLSearchParams(location.search);
          const data = searchParams.get('data');
          if (data) {
            const decodedData = decodeURIComponent(atob(data));
            const parsedPoll = JSON.parse(decodedData);
            if (parsedPoll.id === pollId) {
              setPoll(parsedPoll);
            }
          }
        } catch (error) {
          console.error("Failed to parse poll data from URL", error);
        }
      }, [location.search, pollId]);

      useEffect(() => {
        if (!poll) return;

        const fetchVotes = async () => {
          const { data, error } = await supabase
            .from('tool_requests')
            .select('tool_description')
            .eq('tool_name', `poll_votes_${poll.id}`);

          if (!error && data.length > 0) {
            const fetchedVotes = JSON.parse(data[0].tool_description);
            setVotes(fetchedVotes);
            setTotalVotes(Object.values(fetchedVotes).reduce((a, b) => a + b, 0));
          }
          setIsLoading(false);
        };

        fetchVotes();

        const channel = supabase
          .channel(`poll-votes-${poll.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_requests', filter: `tool_name=eq.poll_votes_${poll.id}` },
            (payload) => {
              if (payload.new && payload.new.tool_description) {
                const newVotes = JSON.parse(payload.new.tool_description);
                setVotes(newVotes);
                setTotalVotes(Object.values(newVotes).reduce((a, b) => a + b, 0));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [poll]);

      const handleVote = async () => {
        if ((!poll.isMultipleChoice && selectedOption === null) || (poll.isMultipleChoice && selectedOptions.length === 0)) {
          toast({ title: 'Error', description: 'Please select an option to vote.', variant: 'destructive' });
          return;
        }

        const newVotes = { ...votes };
        if (poll.isMultipleChoice) {
          selectedOptions.forEach(optionIndex => {
            newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
          });
        } else {
          newVotes[selectedOption] = (newVotes[selectedOption] || 0) + 1;
        }

        const { error } = await supabase
          .from('tool_requests')
          .upsert({ tool_name: `poll_votes_${poll.id}`, tool_description: JSON.stringify(newVotes) }, { onConflict: 'tool_name' });

        if (error) {
          toast({ title: 'Error', description: 'Could not record your vote.', variant: 'destructive' });
        } else {
          setHasVoted(true);
          toast({ title: 'Success!', description: 'Your vote has been recorded.' });
        }
      };

      if (!poll && !isLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <h1 className="text-3xl font-bold mb-4">Poll Not Found</h1>
            <p className="text-muted-foreground mb-8">This poll may have been deleted or the link is incorrect.</p>
            <Button asChild><Link to="/poll-maker">Create a new Poll</Link></Button>
          </div>
        );
      }
      
      if (poll && poll.expiryDate && new Date(poll.expiryDate) < new Date()) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <h1 className="text-3xl font-bold mb-4">Poll Expired</h1>
            <p className="text-muted-foreground">This poll is no longer accepting votes.</p>
          </div>
        );
      }

      if (isLoading || !poll) {
        return <div className="flex items-center justify-center min-h-screen">Loading Poll...</div>;
      }

      return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ background: poll.customization.bgColor, color: poll.customization.textColor }}>
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border-none" style={{ background: 'rgba(255,255,255,0.1)', color: poll.customization.textColor }}>
              <CardHeader>
                <CardTitle className="text-3xl font-extrabold text-center tracking-tight">{poll.question}</CardTitle>
                {poll.creatorName && <p className="text-center opacity-80">Created by {poll.creatorName}</p>}
              </CardHeader>
              <CardContent>
                {hasVoted ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center"><BarChart2 className="mr-2" /> Results</h3>
                    {poll.options.map((option, index) => {
                      const voteCount = votes[index] || 0;
                      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center font-medium">
                            <span>{option}</span>
                            <span>{voteCount} votes</span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-3">
                            <div className="bg-primary h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {poll.isMultipleChoice ? (
                      <div className={`grid gap-4 ${poll.customization.layout === 'grid' ? 'grid-cols-2' : ''}`}>
                        {poll.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border border-white/20 bg-white/10">
                            <Checkbox
                              id={`option-${index}`}
                              checked={selectedOptions.includes(index)}
                              onCheckedChange={(checked) => {
                                setSelectedOptions(prev => checked ? [...prev, index] : prev.filter(i => i !== index));
                              }}
                            />
                            <Label htmlFor={`option-${index}`} className="text-lg cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <RadioGroup onValueChange={(val) => setSelectedOption(parseInt(val))} className={`grid gap-4 ${poll.customization.layout === 'grid' ? 'grid-cols-2' : ''}`}>
                        {poll.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border border-white/20 bg-white/10">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="text-lg cursor-pointer">{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    <Button onClick={handleVote} size="lg" className="w-full font-bold text-lg mt-6">Submit Vote</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center items-center pt-6">
                <p className="text-sm opacity-80">Powered by</p>
                <AnimatedLogo className="h-8 w-auto ml-2" />
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    };

    export default PollVotePage;