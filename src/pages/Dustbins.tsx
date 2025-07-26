import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MapPin, AlertTriangle, Battery, Wifi, Plus, Search, Eye, Calendar, MessageCircle, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getDustbins, addDustbin as addDustbinToFirestore, deleteDustbin, getDrivers, type Dustbin } from "@/lib/dataStore";

interface SchedulePickup {
  binId: string;
  driverId: string;
  scheduledTime: string;
  priority: "high" | "medium" | "low";
  notes: string;
}

const Dustbins = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dustbins, setDustbins] = useState<Dustbin[]>([]);
  const [selectedBin, setSelectedBin] = useState<Dustbin | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    getDustbins().then(setDustbins);
    getDrivers().then(setDrivers);
  }, []);
  
  const [newBin, setNewBin] = useState<Partial<Dustbin>>({
    id: "",
    location: "",
    fillLevel: 0,
    batteryLevel: 100,
    signalStrength: 100,
    status: "good",
    temperature: 20,
    installDate: "",
    model: "",
    capacity: 100,
    coordinates: { lat: 0, lng: 0 }
  });

  const [scheduleData, setScheduleData] = useState<Partial<SchedulePickup>>({
    driverId: "",
    scheduledTime: "",
    priority: "medium",
    notes: ""
  });

  const handleAddDustbin = () => {
    if (!newBin.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    const bin = {
      location: newBin.location!,
      fillLevel: newBin.fillLevel || 0,
      batteryLevel: newBin.batteryLevel || 100,
      signalStrength: newBin.signalStrength || 100,
      lastEmptied: new Date().toISOString().split('T')[0],
      status: newBin.status as "critical" | "warning" | "good" || "good",
      temperature: newBin.temperature || 20,
      coordinates: newBin.coordinates || { lat: 0, lng: 0 },
      installDate: newBin.installDate || new Date().toISOString().split('T')[0],
      model: newBin.model || "",
      capacity: newBin.capacity || 100
    };
    addDustbinToFirestore(bin).then(() => getDustbins().then(setDustbins));
    setNewBin({
      location: "",
      fillLevel: 0,
      batteryLevel: 100,
      signalStrength: 100,
      status: "good",
      temperature: 20,
      installDate: "",
      model: "",
      capacity: 100,
      coordinates: { lat: 0, lng: 0 }
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Success",
      description: "Dustbin added successfully",
    });
  };

  const schedulePickup = () => {
    if (!scheduleData.driverId || !scheduleData.scheduledTime) {
      toast({
        title: "Error",
        description: "Please select a driver and scheduled time",
        variant: "destructive",
      });
      return;
    }

    const driver = drivers.find(d => d.id === scheduleData.driverId);
    if (!driver || !selectedBin) return;

    // Send WhatsApp message to driver
    const message = `🚛 PICKUP SCHEDULED
    
Bin ID: ${selectedBin.id}
Location: ${selectedBin.location}
Fill Level: ${selectedBin.fillLevel}%
Scheduled Time: ${scheduleData.scheduledTime}
Priority: ${scheduleData.priority?.toUpperCase()}
Notes: ${scheduleData.notes || "None"}

Please proceed to collect this bin. Get route: https://maps.google.com/maps?q=${selectedBin.coordinates.lat},${selectedBin.coordinates.lng}`;

    const phoneNumber = driver.phone.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    setIsScheduleDialogOpen(false);
    setScheduleData({
      driverId: "",
      scheduledTime: "",
      priority: "medium",
      notes: ""
    });

    toast({
      title: "Pickup Scheduled",
      description: `WhatsApp message sent to ${driver.name} with route information`,
    });
  };

  const handleDeleteDustbin = (id: string) => {
    deleteDustbin(id).then(() => getDustbins().then(setDustbins));
    toast({
      title: "Success",
      description: "Dustbin deleted successfully",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "warning": return "warning";
      case "good": return "success";
      default: return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "critical": return "Critical";
      case "warning": return "Warning";
      case "good": return "Good";
      default: return "Unknown";
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-success";
    if (level > 20) return "text-warning";
    return "text-destructive";
  };

  const getSignalColor = (strength: number) => {
    if (strength > 70) return "text-success";
    if (strength > 40) return "text-warning";
    return "text-destructive";
  };

  const filteredDustbins = dustbins.filter(bin => {
    const matchesSearch = bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bin.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const criticalCount = dustbins.filter(bin => bin.status === "critical").length;
  const warningCount = dustbins.filter(bin => bin.status === "warning").length;
  const goodCount = dustbins.filter(bin => bin.status === "good").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dustbins Management</h1>
          <p className="text-muted-foreground">Monitor and manage smart waste collection bins</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Dustbin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Dustbin</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="binId">Bin ID *</Label>
                <Input
                  id="binId"
                  value={newBin.id}
                  onChange={(e) => setNewBin({ ...newBin, id: e.target.value })}
                  placeholder="BIN-A001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={newBin.location}
                  onChange={(e) => setNewBin({ ...newBin, location: e.target.value })}
                  placeholder="Main Street & 1st Ave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newBin.model}
                  onChange={(e) => setNewBin({ ...newBin, model: e.target.value })}
                  placeholder="SmartBin Pro 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (L)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newBin.capacity}
                  onChange={(e) => setNewBin({ ...newBin, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={newBin.coordinates?.lat}
                  onChange={(e) => setNewBin({ 
                    ...newBin, 
                    coordinates: { 
                      ...newBin.coordinates!, 
                      lat: parseFloat(e.target.value) || 0 
                    }
                  })}
                  placeholder="40.7128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={newBin.coordinates?.lng}
                  onChange={(e) => setNewBin({ 
                    ...newBin, 
                    coordinates: { 
                      ...newBin.coordinates!, 
                      lng: parseFloat(e.target.value) || 0 
                    }
                  })}
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDustbin}>Add Dustbin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bins</p>
                <p className="text-xl font-bold">{dustbins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-xl font-bold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Warning</p>
                <p className="text-xl font-bold">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Good Status</p>
                <p className="text-xl font-bold">{goodCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by bin ID or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="good">Good</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dustbins Grid or List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dustbins.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 col-span-full">
            No dustbins available. Add a dustbin to get started.
          </div>
        ) : (
          filteredDustbins.map((bin) => (
            <Card key={bin.id} className="shadow-card hover:shadow-elegant transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{bin.id}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {bin.location}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(bin.status)}>
                    {getStatusText(bin.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fill Level */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fill Level</span>
                    <span className="font-medium">{bin.fillLevel}%</span>
                  </div>
                  <Progress value={bin.fillLevel} className="h-3" />
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${getBatteryColor(bin.batteryLevel)}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="font-medium">{bin.batteryLevel}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className={`h-4 w-4 ${getSignalColor(bin.signalStrength)}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Signal</p>
                      <p className="font-medium">{bin.signalStrength}%</p>
                    </div>
                  </div>
                </div>
                {/* Additional Info */}
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Emptied:</span>
                    <span>{bin.lastEmptied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperature:</span>
                    <span>{bin.temperature}°C</span>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 flex items-center gap-1"
                    onClick={() => {
                      setSelectedBin(bin);
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
                    onClick={() => {
                      setSelectedBin(bin);
                      setIsScheduleDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-3 w-3" />
                    Schedule Pickup
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 flex items-center gap-1"
                    onClick={() => handleDeleteDustbin(bin.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dustbin Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dustbin Details</DialogTitle>
          </DialogHeader>
          {selectedBin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedBin.id}</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedBin.location}
                  </p>
                </div>
                <Badge variant={getStatusColor(selectedBin.status)}>
                  {getStatusText(selectedBin.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Bin Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{selectedBin.model || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">{selectedBin.capacity}L</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Install Date</p>
                      <p className="font-medium">{selectedBin.installDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coordinates</p>
                      <p className="font-medium">{selectedBin.coordinates.lat}, {selectedBin.coordinates.lng}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Current Status</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Fill Level</p>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedBin.fillLevel} className="flex-1 h-2" />
                        <span className="font-medium text-sm">{selectedBin.fillLevel}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Battery Level</p>
                      <p className="font-medium">{selectedBin.batteryLevel}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Signal Strength</p>
                      <p className="font-medium">{selectedBin.signalStrength}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="font-medium">{selectedBin.temperature}°C</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Emptied:</span>
                  <span className="font-medium">{selectedBin.lastEmptied}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    const mapsUrl = `https://maps.google.com/maps?q=${selectedBin.coordinates.lat},${selectedBin.coordinates.lng}`;
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Pickup Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Pickup</DialogTitle>
          </DialogHeader>
          {selectedBin && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedBin.id}</h4>
                <p className="text-sm text-muted-foreground">{selectedBin.location}</p>
                <p className="text-sm">Fill Level: <span className="font-medium">{selectedBin.fillLevel}%</span></p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="driver">Assign Driver *</Label>
                  <Select value={scheduleData.driverId} onValueChange={(value) => setScheduleData({ ...scheduleData, driverId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduledTime">Scheduled Time *</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduleData.scheduledTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledTime: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={scheduleData.priority} onValueChange={(value) => setScheduleData({ ...scheduleData, priority: value as "high" | "medium" | "low" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional instructions..."
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={schedulePickup} className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Schedule & Notify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dustbins;