'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, Phone, MapPin, Building, Briefcase, ArrowLeft, FileText, Award, Users, HardHat, IndianRupee, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { projectsService, teamMembersService, certificationsService, documentsService, Project, TeamMember, Certification, Document } from "@/lib/data-service";
import { toast } from "sonner";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { user, userProfile, updateUserProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for profile editing
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    phone: '',
    role: '',
    department: '',
    location: '',
    address: '',
    gst: '',
    pan: '',
    cin: '',
    website: '',
    about: ''
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        company_name: userProfile.company_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        location: userProfile.location || '',
        address: userProfile.address || '',
        gst: userProfile.gst || '',
        pan: userProfile.pan || '',
        cin: userProfile.cin || '',
        website: userProfile.website || '',
        about: userProfile.about || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, teamData, certsData, docsData] = await Promise.all([
        projectsService.getProjects(),
        teamMembersService.getTeamMembers(),
        certificationsService.getCertifications(),
        documentsService.getDocuments()
      ]);
      
      setProjects(projectsData);
      setTeamMembers(teamData);
      setCertifications(certsData);
      setDocuments(docsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      await updateUserProfile(profileForm);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleProfileCancel = () => {
    if (userProfile) {
      setProfileForm({
        company_name: userProfile.company_name || '',
        phone: userProfile.phone || '',
        role: userProfile.role || '',
        department: userProfile.department || '',
        location: userProfile.location || '',
        address: userProfile.address || '',
        gst: userProfile.gst || '',
        pan: userProfile.pan || '',
        cin: userProfile.cin || '',
        website: userProfile.website || '',
        about: userProfile.about || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Company Profile</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleProfileCancel} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleProfileSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Company Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userProfile?.avatar_url || "/company-logo.png"} alt={userProfile?.company_name || "Company"} />
                    <AvatarFallback>
                      {userProfile?.company_name?.charAt(0) || userProfile?.full_name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="icon" className="absolute bottom-0 right-0 rounded-full" variant="secondary">
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{userProfile?.company_name || userProfile?.full_name || "Company Name"}</h2>
                  <p className="text-muted-foreground">{userProfile?.role || "Role not set"}</p>
                  <p className="text-sm text-muted-foreground">{userProfile?.about || "No description available"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Location</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                      placeholder="Enter location"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{userProfile?.location || "Location not set"}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Address</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                      placeholder="Enter address"
                    />
                  ) : (
                    <p>{userProfile?.address || "Address not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Contact</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{userProfile?.phone || "Phone not set"}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{userProfile?.email || "Email not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">GST Number</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.gst}
                      onChange={(e) => setProfileForm({...profileForm, gst: e.target.value})}
                      placeholder="Enter GST number"
                    />
                  ) : (
                    <p>{userProfile?.gst || "GST not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">PAN Number</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.pan}
                      onChange={(e) => setProfileForm({...profileForm, pan: e.target.value})}
                      placeholder="Enter PAN number"
                    />
                  ) : (
                    <p>{userProfile?.pan || "PAN not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">CIN Number</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.cin}
                      onChange={(e) => setProfileForm({...profileForm, cin: e.target.value})}
                      placeholder="Enter CIN number"
                    />
                  ) : (
                    <p>{userProfile?.cin || "CIN not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Website</Label>
                  {isEditing ? (
                    <Input
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                      placeholder="Enter website URL"
                    />
                  ) : (
                    <p>{userProfile?.website || "Website not set"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Projects, Team, Certifications, Documents */}
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <HardHat className="h-5 w-5" />
                      Projects ({projects.length})
                    </span>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No projects found. Create your first project to get started.</p>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{project.name}</h4>
                              <p className="text-sm text-muted-foreground">{project.location} • {project.type}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'}>
                                  {project.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {project.start_date} - {project.end_date}
                                </span>
                                <span className="text-sm font-medium">
                                  Budget: ₹{project.budget?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members ({teamMembers.length})
                    </span>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No team members found. Add your first team member to get started.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">{member.role} • {member.department}</p>
                              <p className="text-sm text-muted-foreground mt-1">{member.contact}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications ({certifications.length})
                    </span>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {certifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No certifications found. Add your first certification to get started.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{cert.name}</h4>
                              <p className="text-sm text-muted-foreground">Issued by: {cert.issuer}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Issue Date: {cert.issue_date}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Valid Until: {cert.valid_until}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents ({documents.length})
                    </span>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No documents found. Upload your first document to get started.</p>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <h4 className="font-semibold">{doc.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {doc.type} • {doc.size} • Uploaded: {doc.uploaded_at}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 