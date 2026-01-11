import { Trophy, Calendar, Award, Users, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const competitions = [
  {
    title: "DecodingTrust Agent Challenge 2026",
    status: "Active",
    deadline: "March 31, 2026",
    prize: "$50,000",
    participants: 234,
    description: "Build the most robust AI agent that can defend against adversarial attacks across all domains.",
    tracks: ["Finance", "Healthcare", "E-commerce"],
  },
  {
    title: "Red Team Competition",
    status: "Coming Soon",
    deadline: "Q2 2026",
    prize: "$25,000",
    participants: 0,
    description: "Discover novel attack vectors using our autonomous red-teaming framework.",
    tracks: ["Prompt Injection", "Policy Violation", "Data Exfiltration"],
  },
]

export function CompetitionSection() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Trophy className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Competitions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Participate in our challenges to advance AI agent security research and win prizes.
          </p>
        </div>

        <div className="space-y-6">
          {competitions.map((comp) => (
            <Card key={comp.title} className="bg-card border-border overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{comp.title}</CardTitle>
                      <Badge
                        variant={comp.status === "Active" ? "default" : "secondary"}
                        className={comp.status === "Active" ? "bg-accent text-accent-foreground" : ""}
                      >
                        {comp.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">{comp.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-sm font-medium">{comp.deadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prize Pool</p>
                      <p className="text-sm font-medium text-accent">{comp.prize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Participants</p>
                      <p className="text-sm font-medium">{comp.participants || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tracks</p>
                      <p className="text-sm font-medium">{comp.tracks.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {comp.tracks.map((track) => (
                    <Badge key={track} variant="outline" className="text-xs">
                      {track}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    disabled={comp.status !== "Active"}
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    {comp.status === "Active" ? "Register Now" : "Notify Me"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline">View Rules</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg border border-border bg-card text-center">
          <h3 className="text-lg font-semibold mb-2">Want to sponsor a competition?</h3>
          <p className="text-muted-foreground mb-4">
            Partner with us to advance AI security research and reach top researchers worldwide.
          </p>
          <Button variant="outline">Contact Us</Button>
        </div>
      </div>
    </section>
  )
}
