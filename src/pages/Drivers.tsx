import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Phone, MapPin, Clock, Plus, Car, Eye, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getDrivers, addDriver as addDriverToFirestore, deleteDriver, type Driver } from "@/lib/dataStore";

const Drivers = () => {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getDrivers().then(setDrivers);
  }, []);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    name: "",
    phone: "",
    email: "",
    status: "active",
    currentRoute: "",
    location: "",
    vehicleId: "",
    address: "",
    emergencyContact: "",
    licenseNumber: "",
    experience: ""
  });

  const handleAddDriver = () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const driver: Driver = {
      id: Date.now().toString(),
      name: newDriver.name!,
      phone: newDriver.phone!,
      email: newDriver.email!,
      status: newDriver.status as "active" | "break" | "offline" || "active",
      currentRoute: newDriver.currentRoute || "",
      location: newDriver.location || "",
      completedToday: 0,
      efficiency: 100,
      vehicleId: newDriver.vehicleId || "",
      address: newDriver.address || "",
      emergencyContact: newDriver.emergencyContact || "",
      licenseNumber: newDriver.licenseNumber || "",
      experience: newDriver.experience || ""
    };

    addDriverToFirestore(driver).then(() => getDrivers().then(setDrivers));
    setNewDriver({
      name: "",
      phone: "",
      email: "",
      status: "active",
      currentRoute: "",
      location: "",
      vehicleId: "",
      address: "",
      emergencyContact: "",
      licenseNumber: "",
      experience: ""
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Success",
      description: "Driver added successfully",
    });
  };

  const sendWhatsAppMessage = (driver: Driver, message: string) => {
    const phoneNumber = driver.phone.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "WhatsApp Message",
      description: `Opening WhatsApp to send message to ${driver.name}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "break": return "warning";
      case "offline": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "break": return "On Break";
      case "offline": return "Offline";
      default: return "Unknown";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const handleDeleteDriver = (id: string) => {
    deleteDriver(id).then(() => getDrivers().then(setDrivers));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drivers Management</h1>
          <p className="text-muted-foreground">Monitor and manage your waste collection drivers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                  placeholder="Driver name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newDriver.email}
                  onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                  placeholder="driver@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newDriver.status} onValueChange={(value) => setNewDriver({ ...newDriver, status: value as "active" | "break" | "offline" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="break">On Break</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle ID</Label>
                <Input
                  id="vehicleId"
                  value={newDriver.vehicleId}
                  onChange={(e) => setNewDriver({ ...newDriver, vehicleId: e.target.value })}
                  placeholder="TRK-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={newDriver.licenseNumber}
                  onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                  placeholder="License number"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newDriver.address}
                  onChange={(e) => setNewDriver({ ...newDriver, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={newDriver.emergencyContact}
                  onChange={(e) => setNewDriver({ ...newDriver, emergencyContact: e.target.value })}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={newDriver.experience}
                  onChange={(e) => setNewDriver({ ...newDriver, experience: e.target.value })}
                  placeholder="5 years"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDriver}>Add Driver</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-xl font-bold">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-xl font-bold">{drivers.filter(d => d.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">On Break</p>
                <p className="text-xl font-bold">{drivers.filter(d => d.status === "break").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-xl font-bold">{drivers.filter(d => d.status === "offline").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end mb-4">
        <Input
          type="text"
          placeholder="Search drivers by name, phone, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 col-span-full">
            No drivers found. Add a driver to get started.
          </div>
        ) : (
          drivers
            .filter(driver =>
              driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              driver.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
              driver.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((driver) => (
              <Card key={driver.id} className="shadow-card hover:shadow-elegant transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{driver.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(driver.status)}>
                      {getStatusText(driver.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Route</p>
                      <p className="font-medium">{driver.currentRoute}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vehicle</p>
                      <p className="font-medium">{driver.vehicleId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Current Location:</span>
                    <span className="font-medium">{driver.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{driver.completedToday}</p>
                      <p className="text-xs text-muted-foreground">Routes Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">{driver.efficiency}%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 flex items-center gap-1"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 flex items-center gap-1"
                      onClick={() => sendWhatsAppMessage(driver, `Hello ${driver.name}, please check your route assignment.`)}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Contact
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleDeleteDriver(driver.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Driver Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{getInitials(selectedDriver.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedDriver.name}</h3>
                  <Badge variant={getStatusColor(selectedDriver.status)}>
                    {getStatusText(selectedDriver.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedDriver.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedDriver.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedDriver.address || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{selectedDriver.emergencyContact || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Work Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle ID</p>
                      <p className="font-medium">{selectedDriver.vehicleId || "Not assigned"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">License Number</p>
                      <p className="font-medium">{selectedDriver.licenseNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedDriver.experience || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Route</p>
                      <p className="font-medium">{selectedDriver.currentRoute || "Not assigned"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{selectedDriver.completedToday}</p>
                  <p className="text-sm text-muted-foreground">Routes Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{selectedDriver.efficiency}%</p>
                  <p className="text-sm text-muted-foreground">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">Active</p>
                  <p className="text-sm text-muted-foreground">Status</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => sendWhatsAppMessage(selectedDriver, `Hello ${selectedDriver.name}, please provide your current location and status update.`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send WhatsApp Message
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;