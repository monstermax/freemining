

# RIG Manager

Tous les outils pour gérer son rig :

- monitoring
  - start/stop service (miner) => ./service.sh
  - monitoring des services => ./service.sh
    - gestion des API des miners => ./miners_api/
  - outils monitoring GPU (temperature / fan speed) => ./gpu_tools/
  
- installation simplifiée des outils et miners
  - outils pour installer les miners => ./miner_install.sh

- agent de communication avec la ferme (farm_manager) => ./farm_agent/




## Installation

```bash
./tools/install_rig_manager.sh
```

## Usage

```bash
./rig_manager.sh
```
