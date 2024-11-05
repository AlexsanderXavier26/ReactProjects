import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import bcrypt from "bcryptjs";

// Simulação de JWT (não use isso em produção!)
const fakeJwt = {
  sign: (payload, secret, options) => {
    return btoa(JSON.stringify({ payload, secret, options }));
  },
  verify: (token, secret) => {
    const decoded = JSON.parse(atob(token));
    if (decoded.secret !== secret) throw new Error("Invalid token");
    return decoded.payload;
  },
};

// Chave secreta para JWT (em um cenário real, isso estaria em uma variável de ambiente no servidor)
const JWT_SECRET = "sua_chave_secreta_muito_segura";

// Função para obter coordenadas de uma cidade (simulada)
const getCityCoordinates = (city) => {
  const cities = {
    "Los Angeles, CA": [34.0522, -118.2437],
    "Dallas, TX": [32.7767, -96.797],
    "Chicago, IL": [41.8781, -87.6298],
    "New York, NY": [40.7128, -74.006],
    "Miami, FL": [25.7617, -80.1918],
  };
  return cities[city] || [0, 0]; // Retorna [0, 0] se a cidade não for encontrada
};

// Simulação de um banco de dados (em um cenário real, isso estaria no servidor)
let DB = {
  users: [],
  trucks: [
    {
      id: "001",
      brand: "Peterbilt",
      model: "389",
      license: "ABC1234",
      currentCity: "Los Angeles, CA",
      lastMaintenance: "2024-06-15",
      weight: null,
      cargo: null,
      maintenanceHistory: [],
      image:
        "https://www.bing.com/th?id=OIP.pJRWP6F7EpTp4_aRfXZ1iAHaFj&w=197&h=150&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2",
      location: [34.0522, -118.2437],
      driver: null,
    },
    {
      id: "002",
      brand: "Kenworth",
      model: "W900",
      license: "XYZ5678",
      currentCity: "Dallas, TX",
      lastMaintenance: "2024-05-20",
      weight: null,
      cargo: null,
      maintenanceHistory: [],
      image:
        "https://www.bing.com/th?id=OIP.ZPVimlILJ9LcTRftWW9WaQHaFj&w=193&h=150&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2",
      location: [32.7767, -96.797],
      driver: null,
    },
    {
      id: "003",
      brand: "Freightliner",
      model: "Cascadia",
      license: "LMN4321",
      currentCity: "Chicago, IL",
      lastMaintenance: "2024-04-10",
      weight: null,
      cargo: null,
      maintenanceHistory: [],
      image:
        "https://www.bing.com/th?id=OIP.IXDBB7srMtrLlFcFDoGn9wHaFj&w=177&h=150&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2",
      location: [41.8781, -87.6298],
      driver: null,
    },
  ],
  drivers: [],
  cargos: [],
};

// Função para salvar o "banco de dados"
const saveDB = () => {
  localStorage.setItem("DB", JSON.stringify(DB));
};

// Função para carregar o "banco de dados"
const loadDB = () => {
  const savedDB = localStorage.getItem("DB");
  if (savedDB) {
    DB = JSON.parse(savedDB);
  }
};

// Carregar o DB ao iniciar
loadDB();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [trucks, setTrucks] = useState(DB.trucks);
  const [newTruck, setNewTruck] = useState({
    id: "",
    brand: "",
    model: "",
    license: "",
    currentCity: "",
    image: "",
  });
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [cargoInput, setCargoInput] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  const [drivers, setDrivers] = useState(DB.drivers);
  const [newDriver, setNewDriver] = useState({
    id: "",
    name: "",
    license: "",
    experience: "",
    truckId: "",
  });

  const [cargos, setCargos] = useState(DB.cargos);
  const [newCargo, setNewCargo] = useState({
    id: "",
    company: "",
    type: "",
    loadingPlace: "",
    unloadingPlace: "",
  });

  const maintenanceTypes = [
    "Câmbio",
    "Suspensão",
    "Motor",
    "Parte Elétrica",
    "Freios",
  ];

  useEffect(() => {
    // Verificar se há um token válido no localStorage
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = fakeJwt.verify(token, JWT_SECRET);
        setIsLoggedIn(true);
        setCurrentUser({ username: decoded.username });
      } catch (error) {
        console.error("Token inválido:", error);
        localStorage.removeItem("token");
      }
    }

    // Carregar dados salvos
    loadDB();
    setTrucks(DB.trucks);
    setDrivers(DB.drivers);
    setCargos(DB.cargos);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const user = DB.users.find((u) => u.username === username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = fakeJwt.sign({ username: user.username }, JWT_SECRET, {
        expiresIn: "1h",
      });
      localStorage.setItem("token", token);
      setIsLoggedIn(true);
      setCurrentUser({ username: user.username });
    } else {
      alert("Usuário ou senha incorretos!");
    }
  };

  const handleRegister = async () => {
    if (!username || !password) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    if (username.length < 5 || password.length < 8) {
      alert(
        "O nome de usuário deve ter pelo menos 5 caracteres e a senha pelo menos 8 caracteres."
      );
      return;
    }

    const userExists = DB.users.some((user) => user.username === username);
    if (userExists) {
      alert("Usuário já cadastrado!");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = { username, password: hashedPassword };
      DB.users.push(newUser);
      saveDB();
      alert("Usuário cadastrado com sucesso!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("token");
  };

  const addTruck = () => {
    if (
      !newTruck.id ||
      !newTruck.brand ||
      !newTruck.model ||
      !newTruck.license ||
      !newTruck.currentCity
    ) {
      alert("Preencha todas as informações do caminhão!");
      return;
    }
    const location = getCityCoordinates(newTruck.currentCity);
    const updatedTrucks = [
      ...trucks,
      {
        ...newTruck,
        weight: null,
        cargo: null,
        maintenanceHistory: [],
        image: newTruck.image || "https://example.com/default-truck.jpg",
        location: location,
        driver: null,
      },
    ];
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;
    saveDB();
    setNewTruck({
      id: "",
      brand: "",
      model: "",
      license: "",
      currentCity: "",
      image: "",
    });
    alert("Caminhão adicionado com sucesso!");
  };

  const selectTruck = (truck) => {
    const needsMaintenance = Math.random() < 0.5;
    const maintenanceType = needsMaintenance
      ? maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)]
      : null;

    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

    const maintenanceEntry = {
      type: maintenanceType,
      date: randomDate.toISOString().split("T")[0],
    };

    setSelectedTruck({
      ...truck,
      needsMaintenance,
      maintenanceType,
      maintenanceHistory: [...truck.maintenanceHistory, maintenanceEntry],
    });
  };

  const removeTruck = (truckId) => {
    const updatedTrucks = trucks.filter((truck) => truck.id !== truckId);
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;
    saveDB();
    setSelectedTruck(null);
    alert("Caminhão removido com sucesso!");
  };

  const weighTruck = (truckId) => {
    if (isNaN(weightInput) || weightInput <= 0) {
      alert("Por favor, insira um peso válido.");
      return;
    }
    const updatedTrucks = trucks.map((truck) =>
      truck.id === truckId ? { ...truck, weight: weightInput } : truck
    );
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;
    saveDB();
    setWeightInput("");
    alert("Peso registrado com sucesso!");
  };

  const manageCargo = (truckId) => {
    const updatedTrucks = trucks.map((truck) =>
      truck.id === truckId ? { ...truck, cargo: cargoInput } : truck
    );
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;
    saveDB();
    setCargoInput("");
    alert("Carga registrada com sucesso!");
  };

  const scheduleAppointment = () => {
    if (!appointmentDate) {
      alert("Selecione uma data para o agendamento!");
      return;
    }

    const updatedTrucks = trucks.map((truck) =>
      truck.id === selectedTruck.id ? { ...truck, appointmentDate } : truck
    );

    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;
    saveDB();
    alert(
      `Agendamento realizado para ${selectedTruck.brand} ${selectedTruck.model} no dia ${appointmentDate}`
    );
    setAppointmentDate("");
  };

  const addDriver = () => {
    if (
      !newDriver.id ||
      !newDriver.name ||
      !newDriver.license ||
      !newDriver.experience ||
      !newDriver.truckId
    ) {
      alert("Preencha todas as informações do motorista!");
      return;
    }

    if (newDriver.license.length < 5 || isNaN(newDriver.experience)) {
      alert(
        "Por favor, insira um número de CNH válido e uma experiência numérica."
      );
      return;
    }

    const selectedTruck = trucks.find(
      (truck) => truck.id === newDriver.truckId
    );
    if (!selectedTruck) {
      alert("Caminhão não encontrado!");
      return;
    }

    if (selectedTruck.driver) {
      alert("Este caminhão já possui um motorista!");
      return;
    }

    const updatedTrucks = trucks.map((truck) =>
      truck.id === newDriver.truckId
        ? { ...truck, driver: newDriver.name }
        : truck
    );

    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;

    const updatedDrivers = [...drivers, newDriver];
    setDrivers(updatedDrivers);
    DB.drivers = updatedDrivers;
    saveDB();

    setNewDriver({
      id: "",
      name: "",
      license: "",
      experience: "",
      truckId: "",
    });
    alert("Motorista adicionado com sucesso!");
  };

  const removeDriver = (truckId) => {
    const updatedTrucks = trucks.map((truck) =>
      truck.id === truckId ? { ...truck, driver: null } : truck
    );
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;

    const updatedDrivers = drivers.filter(
      (driver) => driver.truckId !== truckId
    );
    setDrivers(updatedDrivers);
    DB.drivers = updatedDrivers;
    saveDB();

    alert("Motorista removido do caminhão com sucesso!");
  };

  const addCargo = () => {
    if (
      !newCargo.id ||
      !newCargo.company ||
      !newCargo.type ||
      !newCargo.loadingPlace ||
      !newCargo.unloadingPlace
    ) {
      alert("Preencha todas as informações da carga!");
      return;
    }
    const updatedCargos = [...cargos, newCargo];
    setCargos(updatedCargos);
    DB.cargos = updatedCargos;
    saveDB();
    setNewCargo({
      id: "",
      company: "",
      type: "",
      loadingPlace: "",
      unloadingPlace: "",
    });
    alert("Carga adicionada com sucesso!");
  };

  const assignCargoToTruck = (truckId, cargoId) => {
    const cargo = cargos.find((c) => c.id === cargoId);
    if (!cargo) {
      alert("Carga não encontrada!");
      return;
    }

    const updatedTrucks = trucks.map((truck) =>
      truck.id === truckId ? { ...truck, cargo: cargo } : truck
    );
    setTrucks(updatedTrucks);
    DB.trucks = updatedTrucks;

    const updatedCargos = cargos.filter((c) => c.id !== cargoId);
    setCargos(updatedCargos);
    DB.cargos = updatedCargos;
    saveDB();

    alert("Carga atribuída ao caminhão com sucesso!");
  };

  const getTotalTrucks = () => trucks.length;

  const getAverageWeight = () => {
    const totalWeight = trucks.reduce((sum, truck) => {
      return sum + (Number(truck.weight) || 0);
    }, 0);
    return totalWeight / trucks.filter((truck) => truck.weight).length || 0;
  };

  const getTrucksNeedingMaintenance = () => {
    return trucks.filter((truck) => truck.needsMaintenance).length;
  };

  useEffect(() => {
    const moveTrucks = () => {
      setTrucks((prevTrucks) =>
        prevTrucks.map((truck) => {
          const newLocation = [
            truck.location[0] + (Math.random() - 0.5) * 0.01,
            truck.location[1] + (Math.random() - 0.5) * 0.01,
          ];
          return { ...truck, location: newLocation };
        })
      );
    };

    const interval = setInterval(moveTrucks, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Sistema de Gerenciamento de Caminhões
      </h1>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src="https://th.bing.com/th?id=OIP.2DFIaz7Hv0Yla-mUjrYH5QHaEC&w=338&h=184&c=8&rs=1&qlt=90&o=6&pid=3.1&rm=2"
          alt="Caminhão"
          style={{ maxWidth: "300px", width: "100%" }}
        />
      </div>

      {!isLoggedIn ? (
        <div style={{ maxWidth: "300px", margin: "0 auto" }}>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginBottom: "10px",
              padding: "5px",
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginBottom: "10px",
              padding: "5px",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            Entrar
          </button>
          <button
            onClick={handleRegister}
            style={{ display: "block", width: "100%", padding: "10px" }}
          >
            Registrar
          </button>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2>Bem-vindo, {currentUser.username}!</h2>
            <button onClick={handleLogout} style={{ padding: "5px 10px" }}>
              Sair
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>Gerenciar Caminhões</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                placeholder="ID"
                value={newTruck.id}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, id: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Marca"
                value={newTruck.brand}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, brand: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Modelo"
                value={newTruck.model}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, model: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Placa"
                value={newTruck.license}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, license: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Cidade Atual"
                value={newTruck.currentCity}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, currentCity: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="URL da Imagem"
                value={newTruck.image}
                onChange={(e) =>
                  setNewTruck({ ...newTruck, image: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <button onClick={addTruck} style={{ padding: "5px 10px" }}>
                Adicionar Caminhão
              </button>
            </div>

            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {trucks.map((truck) => (
                <div
                  key={truck.id}
                  style={{
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {truck.brand} {truck.model} - Placa: {truck.license}
                    {truck.driver && ` - Motorista: ${truck.driver}`}
                    {truck.cargo && ` - Carga: ${truck.cargo.type}`}
                  </span>
                  <div>
                    <button
                      onClick={() => selectTruck(truck)}
                      style={{ marginRight: "5px" }}
                    >
                      Selecionar
                    </button>
                    <button onClick={() => removeTruck(truck.id)}>
                      Remover
                    </button>
                    {truck.driver && (
                      <button
                        onClick={() => removeDriver(truck.id)}
                        style={{ marginLeft: "5px" }}
                      >
                        Remover Motorista
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedTruck && (
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #ccc",
                  padding: "10px",
                }}
              >
                <h4>Detalhes do Caminhão Selecionado</h4>
                <p>
                  Marca: {selectedTruck.brand} <br />
                  Modelo: {selectedTruck.model} <br />
                  Placa: {selectedTruck.license} <br />
                  Cidade Atual: {selectedTruck.currentCity} <br />
                  Motorista: {selectedTruck.driver || "Não atribuído"} <br />
                  Carga:{" "}
                  {selectedTruck.cargo
                    ? selectedTruck.cargo.type
                    : "Sem carga"}{" "}
                  <br />
                  Necessita Manutenção:{" "}
                  {selectedTruck.needsMaintenance ? "Sim" : "Não"} <br />
                  Tipo de Manutenção: {selectedTruck.maintenanceType ||
                    "N/A"}{" "}
                  <br />
                </p>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <input
                    type="number"
                    placeholder="Peso (kg)"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    style={{ padding: "5px" }}
                  />
                  <button
                    onClick={() => weighTruck(selectedTruck.id)}
                    style={{ padding: "5px 10px" }}
                  >
                    Registrar Peso
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <select
                    value={cargoInput}
                    onChange={(e) => setCargoInput(e.target.value)}
                    style={{ padding: "5px" }}
                  >
                    <option value="">Selecione uma carga</option>
                    {cargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.company} - {cargo.type}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      assignCargoToTruck(selectedTruck.id, cargoInput)
                    }
                    style={{ padding: "5px 10px" }}
                  >
                    Atribuir Carga
                  </button>
                </div>
                <div
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
                >
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    style={{ padding: "5px" }}
                  />
                  <button
                    onClick={scheduleAppointment}
                    style={{ padding: "5px 10px" }}
                  >
                    Agendar Manutenção
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>Gerenciar Motoristas</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                placeholder="ID"
                value={newDriver.id}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, id: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Nome"
                value={newDriver.name}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, name: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Número da CNH"
                value={newDriver.license}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, license: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Experiência (anos)"
                value={newDriver.experience}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, experience: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <select
                value={newDriver.truckId}
                onChange={(e) =>
                  setNewDriver({ ...newDriver, truckId: e.target.value })
                }
                style={{ padding: "5px" }}
              >
                <option value="">Selecione um caminhão</option>
                {trucks
                  .filter((truck) => !truck.driver)
                  .map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.brand} {truck.model} - {truck.license}
                    </option>
                  ))}
              </select>
              <button onClick={addDriver} style={{ padding: "5px 10px" }}>
                Adicionar Motorista
              </button>
            </div>

            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {drivers.map((driver) => (
                <div key={driver.id} style={{ marginBottom: "5px" }}>
                  <span>
                    {driver.name} - CNH: {driver.license}, Experiência:{" "}
                    {driver.experience} anos, Caminhão: {driver.truckId}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>Gerenciar Cargas</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                placeholder="ID"
                value={newCargo.id}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, id: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Empresa"
                value={newCargo.company}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, company: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Tipo de Carga"
                value={newCargo.type}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, type: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Local de Carregamento"
                value={newCargo.loadingPlace}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, loadingPlace: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <input
                placeholder="Local de Descarregamento"
                value={newCargo.unloadingPlace}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, unloadingPlace: e.target.value })
                }
                style={{ padding: "5px" }}
              />
              <button onClick={addCargo} style={{ padding: "5px 10px" }}>
                Adicionar Carga
              </button>
            </div>

            <div
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {cargos.map((cargo) => (
                <div key={cargo.id} style={{ marginBottom: "5px" }}>
                  <span>
                    {cargo.company} - Tipo: {cargo.type}, De:{" "}
                    {cargo.loadingPlace}, Para: {cargo.unloadingPlace}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: "400px", marginBottom: "20px" }}>
            <h3>Mapa de Caminhões</h3>
            <MapContainer
              center={[37.7749, -122.4194]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {trucks.map((truck) => (
                <Marker
                  key={truck.id}
                  position={truck.location}
                  icon={
                    new L.Icon({
                      iconUrl: truck.image,
                      iconSize: [32, 32],
                      iconAnchor: [16, 32],
                    })
                  }
                >
                  <Popup>
                    {truck.brand} {truck.model} - Placa: {truck.license}
                    <br />
                    Motorista: {truck.driver || "Não atribuído"}
                    <br />
                    Carga:{" "}
                    {truck.cargo
                      ? `${truck.cargo.type} (${truck.cargo.company})`
                      : "Sem carga"}
                    <br />
                    Cidade: {truck.currentCity}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div>
            <h3>Estatísticas</h3>
            <p>Total de Caminhões: {getTotalTrucks()}</p>
            <p>Peso Médio dos Caminhões: {getAverageWeight().toFixed(2)} kg</p>
            <p>
              Caminhões que Necessitam de Manutenção:{" "}
              {getTrucksNeedingMaintenance()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
