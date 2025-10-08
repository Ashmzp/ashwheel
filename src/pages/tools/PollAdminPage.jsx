import React, { useState, useEffect, useRef } from 'react';
    import { useLocation, Link, useParams } from 'react-router-dom';
    import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Progress } from '@/components/ui/progress';
    import { useToast } from '@/components/ui/use-toast';
    import { Copy, Share2, Download, BarChart2, Settings, Trash2 } from 'lucide-react';
    import QRCode from 'qrcode.react';
    import AnimatedLogo from '@/components/AnimatedLogo';
    import { useLocalStorage } from '@/hooks/useLocalStorage';
    import { supabase } from '@/lib/customSupabaseClient';

    const PollAdminPage = () => {
      const { adminId } = useParams();
      const [poll, setPoll] = useState(null);
      const [votes, setVotes] = useState({});
      const [totalVotes, setTotalVotes] = useState(0);
      const [isLoading, setIsLoading] = useState(true);
      const { toast } = useToast();
      const [pollsData, setPollsData] = useLocalStorage('polls', {});

      useEffect(() => {
        const localPoll = Object.values(pollsData).find(p => p.adminId === adminId);
        if (localPoll) {
          setPoll(localPoll);
        } else {
          setIsLoading(false);
        }
      }, [adminId, pollsData]);

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

      if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
      }

      if (!poll) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <h1 className="text-3xl font-bold mb-4">Poll Not Found</h1>
            <p className="text-muted-foreground mb-8">The admin link seems to be invalid or the poll has been deleted.</p>
            <Button asChild><Link to="/poll-maker">Create a new Poll</Link></Button>
          </div>
        );
      }

      const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
      };

      const downloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Option,Votes\n";
        poll.options.forEach((option, index) => {
          csvContent += `"${option.replace(/"/g, '""')}",${votes[index] || 0}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `poll_results_${poll.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      
      const deletePoll = () => {
        if(window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
            const newPolls = {...pollsData};
            delete newPolls[poll.id];
            setPollsData(newPolls);
            // Also delete votes from supabase
            supabase.from('tool_requests').delete().eq('tool_name', `poll_votes_${poll.id}`).then(() => {
                window.location.href = '/poll-maker';
            });
        }
      }

      const voterLink = `${window.location.origin}/poll/vote/${poll.id}`;
      const adminLink = `${window.location.origin}/poll/admin/${poll.adminId}`;

      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-gray-900 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm shadow-2xl">
              <CardHeader>
                <CardTitle className="text-3xl font-extrabold text-center tracking-tight">{poll.question}</CardTitle>
                {poll.creatorName && <p className="text-center text-muted-foreground">Created by {poll.creatorName}</p>}
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center"><BarChart2 className="mr-2" /> Results ({totalVotes} votes)</h3>
                  {poll.options.map((option, index) => {
                    const voteCount = votes[index] || 0;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option}</span>
                          <span className="text-sm font-bold">{voteCount} votes ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-3" />
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                   <h3 className="text-xl font-bold flex items-center"><Settings className="mr-2" /> Admin Panel</h3>
                   <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label>Voter Link (Share this)</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={voterLink} />
                                    <Button size="icon" variant="outline" onClick={() => copyLink(voterLink)}><Copy className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="outline" onClick={() => navigator.share({ url: voterLink, title: poll.question })}><Share2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                             <div>
                                <Label>Admin Link (Keep this private)</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={adminLink} />
                                    <Button size="icon" variant="outline" onClick={() => copyLink(adminLink)}><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-around items-center text-center">
                            <div>
                                <p className="font-semibold mb-2">Voter QR Code</p>
                                <div className="p-2 bg-white rounded-lg inline-block"><QRCode value={voterLink} size={128} /></div>
                            </div>
                             <div>
                                <p className="font-semibold mb-2">Admin QR Code</p>
                                <div className="p-2 bg-white rounded-lg inline-block"><QRCode value={adminLink} size={128} /></div>
                            </div>
                        </div>
                   </div>
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button onClick={downloadCSV}><Download className="mr-2 h-4 w-4" /> Download Results (CSV)</Button>
                    <Button variant="destructive" onClick={deletePoll}><Trash2 className="mr-2 h-4 w-4" /> Delete Poll</Button>
                </div>

              </CardContent>
              <CardFooter className="flex justify-center items-center pt-6">
                <p className="text-sm text-muted-foreground">Powered by</p>
                <AnimatedLogo className="h-8 w-auto ml-2" />
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    };

    export default PollAdminPage;