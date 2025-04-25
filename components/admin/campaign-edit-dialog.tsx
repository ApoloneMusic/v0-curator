"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Campaign } from "@/lib/campaigns"
import { getAllPlaylists } from "@/lib/actions/playlist-actions"
import type { Playlist } from "@/lib/playlists"
import { Badge } from "@/components/ui/badge"
import { X, Loader2 } from "lucide-react"
import { getVariables } from "@/lib/variables"
import type { GenreVariable, SimpleVariable, VocalVariable, TempoVariable } from "@/lib/variables"
import { Checkbox } from "@/components/ui/checkbox"

interface CampaignEditDialogProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (campaign: Campaign) => void
}

export function CampaignEditDialog({ campaign, open, onOpenChange, onSave }: CampaignEditDialogProps) {
  const [editedCampaign, setEditedCampaign] = useState<Campaign>({ ...campaign })
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Load dynamic options from variables
  const [genreOptions, setGenreOptions] = useState<GenreVariable[]>([])
  const [vocalOptions, setVocalOptions] = useState<VocalVariable[]>([])
  const [moodOptions, setMoodOptions] = useState<SimpleVariable[]>([])
  const [tempoOptions, setTempoOptions] = useState<TempoVariable[]>([])
  const [languageOptions, setLanguageOptions] = useState<SimpleVariable[]>([])

  const campaignTypes = ["Playlist Pitch", "Influencer Campaign", "Radio Promotion", "PR Campaign", "Other"]

  // Fetch playlists when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchPlaylists = async () => {
        setIsLoading(true)
        try {
          const data = await getAllPlaylists()
          setPlaylists(data || [])
        } catch (error) {
          console.error("Failed to fetch playlists:", error)
        } finally {
          setIsLoading(false)
        }
      }

      const loadVariables = async () => {
        try {
          const genres = (await getVariables("genres")) as GenreVariable[]
          const vocals = (await getVariables("vocals")) as VocalVariable[]
          const moods = (await getVariables("moods")) as SimpleVariable[]
          const tempos = (await getVariables("tempos")) as TempoVariable[]
          const languages = (await getVariables("languages")) as SimpleVariable[]

          setGenreOptions(genres)
          setVocalOptions(vocals)
          setMoodOptions(moods)
          setTempoOptions(tempos)
          setLanguageOptions(languages)
        } catch (error) {
          console.error("Error loading variables:", error)
        }
      }

      fetchPlaylists()
      loadVariables()

      // Reset the edited campaign to the original campaign data
      setEditedCampaign({ ...campaign })
    }
  }, [open, campaign])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (
      name === "track_popularity" ||
      name === "artist_popularity" ||
      name === "artist_followers" ||
      name === "pitches" ||
      name === "matches" ||
      name === "accepted" ||
      name === "declined"
    ) {
      setEditedCampaign({
        ...editedCampaign,
        [name]: Number.parseInt(value) || 0,
      })
    } else {
      setEditedCampaign({
        ...editedCampaign,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditedCampaign({
      ...editedCampaign,
      [name]: value,
    })
  }

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setEditedCampaign((prev) => {
      const currentValues = prev[name] ? (Array.isArray(prev[name]) ? [...prev[name]] : [prev[name]]) : []
      let newValues: string[]

      if (checked) {
        newValues = [...currentValues, value]
      } else {
        newValues = currentValues.filter((item) => item !== value)
      }

      return { ...prev, [name]: newValues }
    })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const date = value ? new Date(value).getTime() : null
    setEditedCampaign({
      ...editedCampaign,
      [name]: date,
    })
  }

  const handleAddPlaylist = () => {
    if (!selectedPlaylistId) return

    // Don't add if already in the list
    if (editedCampaign.matched_playlists?.includes(selectedPlaylistId)) return

    setEditedCampaign({
      ...editedCampaign,
      matched_playlists: [...(editedCampaign.matched_playlists || []), selectedPlaylistId],
      // Update matches count when adding a playlist
      matches: (editedCampaign.matches || 0) + 1,
    })

    setSelectedPlaylistId("")
  }

  const handleRemovePlaylist = (playlistId: string) => {
    setEditedCampaign({
      ...editedCampaign,
      matched_playlists: editedCampaign.matched_playlists?.filter((id) => id !== playlistId) || [],
      // Update matches count when removing a playlist, ensuring it doesn't go below 0
      matches: Math.max(0, (editedCampaign.matches || 0) - 1),
    })
  }

  const handleSave = () => {
    onSave(editedCampaign)
  }

  const getPlaylistName = (id: string) => {
    const playlist = playlists.find((p) => p.id === id)
    return playlist?.name || playlist?.spotifyLink?.split("/").pop() || id
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Campaign #{campaign.campaign_id}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_id">Campaign ID</Label>
              <Input id="campaign_id" name="campaign_id" value={editedCampaign.campaign_id} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_created">Date Created</Label>
              <Input
                id="date_created"
                name="date_created"
                type="date"
                value={new Date(editedCampaign.date_created).toISOString().split("T")[0]}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              name="client_id"
              value={editedCampaign.client_id || ""}
              onChange={handleInputChange}
              placeholder="Enter client ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign_type">Campaign Type</Label>
            <Select
              value={editedCampaign.campaign_type || ""}
              onValueChange={(value) => handleSelectChange("campaign_type", value)}
            >
              <SelectTrigger id="campaign_type" className="w-full">
                <SelectValue placeholder="Select campaign type" />
              </SelectTrigger>
              <SelectContent position="popper">
                {campaignTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="track_name">Track Name</Label>
              <Input
                id="track_name"
                name="track_name"
                value={editedCampaign.track_name || ""}
                onChange={handleInputChange}
                placeholder="Enter track name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="track_link">Track Link</Label>
              <Input
                id="track_link"
                name="track_link"
                value={editedCampaign.track_link || ""}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="track_popularity">Track Popularity</Label>
              <Input
                id="track_popularity"
                name="track_popularity"
                type="number"
                min="0"
                value={editedCampaign.track_popularity || 0}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist_popularity">Artist Popularity</Label>
              <Input
                id="artist_popularity"
                name="artist_popularity"
                type="number"
                min="0"
                value={editedCampaign.artist_popularity || 0}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="artist_followers">Artist Followers</Label>
              <Input
                id="artist_followers"
                name="artist_followers"
                type="number"
                min="0"
                value={editedCampaign.artist_followers || 0}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                name="release_date"
                type="date"
                value={
                  editedCampaign.release_date ? new Date(editedCampaign.release_date).toISOString().split("T")[0] : ""
                }
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-2">
              {genreOptions.map((genre) => (
                <div key={genre.id} className="flex items-center">
                  <Checkbox
                    id={`genre-${genre.id}`}
                    name="genre"
                    value={genre.id}
                    checked={editedCampaign.genre === genre.id}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setEditedCampaign((prev) => ({ ...prev, genre: genre.id }))
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`genre-${genre.id}`} className="text-sm">
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-2">
              {moodOptions.map((mood) => (
                <div key={mood.id} className="flex items-center">
                  <Checkbox
                    id={`mood-${mood.id}`}
                    name="mood"
                    value={mood.id}
                    checked={Array.isArray(editedCampaign.mood) && editedCampaign.mood.includes(mood.id)}
                    onCheckedChange={(checked) => handleCheckboxChange("mood", mood.id, checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`mood-${mood.id}`} className="text-sm">
                    {mood.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-2">
              {tempoOptions.map((tempo) => (
                <div key={tempo.id} className="flex items-center">
                  <Checkbox
                    id={`tempo-${tempo.id}`}
                    name="tempo"
                    value={tempo.id}
                    checked={Array.isArray(editedCampaign.tempo) && editedCampaign.tempo.includes(tempo.id)}
                    onCheckedChange={(checked) => handleCheckboxChange("tempo", tempo.id, checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`tempo-${tempo.id}`} className="text-sm">
                    {tempo.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocal">Vocal</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-2">
              {vocalOptions.map((vocal) => (
                <div key={vocal.id} className="flex items-center">
                  <Checkbox
                    id={`vocal-${vocal.id}`}
                    name="vocal"
                    value={vocal.id}
                    checked={Array.isArray(editedCampaign.vocal) && editedCampaign.vocal.includes(vocal.id)}
                    onCheckedChange={(checked) => handleCheckboxChange("vocal", vocal.id, checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`vocal-${vocal.id}`} className="text-sm">
                    {vocal.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-md p-2">
              {languageOptions.map((language) => (
                <div key={language.id} className="flex items-center">
                  <Checkbox
                    id={`language-${language.id}`}
                    name="language"
                    value={language.id}
                    checked={Array.isArray(editedCampaign.language) && editedCampaign.language.includes(language.id)}
                    onCheckedChange={(checked) => handleCheckboxChange("language", language.id, checked)}
                    className="mr-2"
                  />
                  <label htmlFor={`language-${language.id}`} className="text-sm">
                    {language.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Matched Playlists</Label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] border rounded-md p-2">
              {editedCampaign.matched_playlists?.length > 0 ? (
                editedCampaign.matched_playlists.map((playlistId) => (
                  <Badge key={playlistId} variant="secondary" className="flex items-center gap-1">
                    {getPlaylistName(playlistId)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemovePlaylist(playlistId)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No playlists selected</span>
              )}
            </div>

            <div className="flex gap-2">
              {isLoading ? (
                <div className="flex items-center w-full justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading playlists...</span>
                </div>
              ) : (
                <>
                  <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select playlist" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {playlists.length > 0 ? (
                        playlists.map((playlist) => (
                          <SelectItem key={playlist.id} value={playlist.id}>
                            {playlist.name || playlist.spotifyLink?.split("/").pop() || playlist.id}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-playlists" disabled>
                          No playlists available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddPlaylist} disabled={!selectedPlaylistId}>
                    Add
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
