import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2, Users, MapPin, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getDrivers, getDustbins, deleteDriver, deleteDustbin } from "@/lib/dataStore";
import heroImage from "@/assets/hero-dashboard.jpg";

const Dashboard = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dustbins, setDustbins] = useState<any[]>([]);

  useEffect(() => {
    getDrivers().then(setDrivers);
    getDustbins().then(setDustbins);
  }, []);

  const criticalBins = dustbins.filter(bin => bin.fillLevel >= 90);
  const warningBins = dustbins.filter(bin => bin.fillLevel >= 75 && bin.fillLevel < 90);
  const activeDrivers = drivers.filter(driver => driver.status === "active");

  const stats = [
    {
      title: "Total Dustbins",
      value: dustbins.length.toString(),
      change: dustbins.length > 0 ? "+100%" : "0%",
      icon: Trash2,
      color: "text-primary"
    },
    {
      title: "Active Drivers",
      value: activeDrivers.length.toString(),
      change: activeDrivers.length > 0 ? "+100%" : "0%",
      icon: Users,
      color: "text-accent"
    },
    {
      title: "Critical Alerts",
      value: criticalBins.length.toString(),
      change: criticalBins.length > 0 ? `${criticalBins.length} bins` : "0",
      icon: MapPin,
      color: "text-success"
    },
    {
      title: "Alerts",
      value: (criticalBins.length + warningBins.length).toString(),
      change: warningBins.length > 0 ? `${warningBins.length} warnings` : "0",
      icon: AlertTriangle,
      color: "text-warning"
    }
  ];

  // Show critical bins as alerts
  const recentAlerts = criticalBins.slice(0, 4).map(bin => ({
    id: bin.id,
    bin: bin.id,
    location: bin.location,
    level: bin.fillLevel,
    status: bin.status
  }));

  // Delete handlers
  const handleDeleteDriver = (name: string) => {
    const driver = drivers.find(d => d.name === name);
    if (driver) {
      deleteDriver(driver.id).then(() => getDrivers().then(setDrivers));
    }
  };
  const handleDeleteDustbin = (id: string) => {
    deleteDustbin(id).then(() => getDustbins().then(setDustbins));
  };

  // Show top drivers
  const topDrivers = drivers
    .filter(driver => driver.status === "active")
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 4)
    .map(driver => ({
      name: driver.name,
      routes: driver.completedToday,
      efficiency: driver.efficiency
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "warning": return "warning";
      default: return "success";
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden h-64">
        <img 
          src={heroImage} 
          alt="Smart Waste Management Dashboard" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/60 flex items-center">
          <div className="text-white px-8">
            <h1 className="text-4xl font-bold mb-2">Smart Waste Management</h1>
            <p className="text-xl opacity-90">Efficiently managing city waste with IoT technology</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-card hover:shadow-elegant transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Critical Alerts
            </CardTitle>
            <CardDescription>
              Dustbins requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="space-y-1">
                      <p className="font-medium">{alert.bin}</p>
                      <p className="text-sm text-muted-foreground">{alert.location}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={getStatusColor(alert.status)}>
                        {alert.level}% Full
                      </Badge>
                      <Progress value={alert.level} className="w-20 h-2" />
                      <button
                        className="mt-2 text-xs text-destructive underline hover:opacity-80"
                        onClick={() => handleDeleteDustbin(alert.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No critical alerts. Add dustbins to monitor status.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Area */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Top Performing Area
            </CardTitle>
            <CardDescription>
              Area(s) with the highest average dustbin fill level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                if (dustbins.length === 0) {
                  return <div className="text-center py-8 text-muted-foreground">No data available.</div>;
                }
                // Group dustbins by location/area
                const areaMap: Record<string, number[]> = {};
                dustbins.forEach(bin => {
                  if (!areaMap[bin.location]) areaMap[bin.location] = [];
                  areaMap[bin.location].push(bin.fillLevel);
                });
                // Calculate average fill level per area
                const areaAverages = Object.entries(areaMap).map(([area, fills]) => ({
                  area,
                  avg: fills.reduce((a, b) => a + b, 0) / fills.length
                }));
                // Find the highest average(s)
                const maxAvg = Math.max(...areaAverages.map(a => a.avg));
                const topAreas = areaAverages.filter(a => a.avg === maxAvg);
                return topAreas.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="space-y-1">
                      <p className="font-medium">{a.area}</p>
                      <p className="text-sm text-muted-foreground">Avg. Fill Level</p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="success">{a.avg.toFixed(1)}%</Badge>
                      <Progress value={a.avg} className="w-20 h-2" />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Drivers */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Top Performing Drivers
            </CardTitle>
            <CardDescription>
              Today's most efficient drivers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDrivers.length > 0 ? (
                topDrivers.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="space-y-1">
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">{driver.routes} routes completed</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="success">
                        {driver.efficiency}% Efficient
                      </Badge>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <button
                        className="mt-2 text-xs text-destructive underline hover:opacity-80"
                        onClick={() => handleDeleteDriver(driver.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No active drivers. Add drivers to see performance data.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;