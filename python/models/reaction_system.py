"""
Reaction System & Stoichiometric Conservation Engine
Inspired by open-source chemical kinetics frameworks (ChemPy / Cantera).

Provides automated stoichiometric matrix calculations and conservation invariant checks
for kinetic reaction networks without third-party runtime dependencies.
"""

import numpy as np

class StoichiometricNetwork:
    """
    Represents a reaction network with species and stoichiometric matrix.
    Computes invariant conservation relations (left nullspace of N: c^T * N = 0).
    """
    def __init__(self, species, reactions, stoichiometric_matrix):
        self.species = list(species)
        self.reactions = list(reactions)
        self.N = np.array(stoichiometric_matrix, dtype=float)
        if self.N.shape != (len(self.species), len(self.reactions)):
            raise ValueError(f"Matrix shape {self.N.shape} does not match species ({len(self.species)}) and reactions ({len(self.reactions)})")

    def find_invariants(self, tol=1e-10):
        """
        Finds conservation vectors c such that c^T * N = 0.
        Uses Singular Value Decomposition (SVD) of N^T.
        """
        # Left nullspace of N is kernel of N^T
        u, s, vh = np.linalg.svd(self.N.T)
        rank = (s > tol).sum()
        null_vectors = vh[rank:]
        return null_vectors

    def verify_conservation(self, trajectory_dict, tol=1e-10):
        """
        Verifies that for all time points, the linear combinations defined by
        the conservation invariants remain strictly constant within tol.
        """
        invariants = self.find_invariants(tol)
        conc_matrix = np.array([trajectory_dict[sp] for sp in self.species]) # (species, time)
        
        for idx, inv in enumerate(invariants):
            # Normalize vector so max component is 1.0
            max_c = np.max(np.abs(inv))
            if max_c > 0:
                normalized_inv = inv / max_c
                # Quantities over time
                total_qty = np.dot(normalized_inv, conc_matrix)
                drift = np.max(np.abs(total_qty - total_qty[0]))
                if drift > tol:
                    return False, f"Invariant {idx} drifted by {drift} > {tol}"
        return True, "All stoichiometric invariants conserved"


def get_m1_network():
    """
    Model M1 network:
    Species: S, P, B, D
    Reactions:
      R1: S -> P (rate k1)
      R2: S -> B (rate k2 = q*k1)
      R3: P -> D (rate k3 = r*k1)
    """
    species = ['S', 'P', 'B', 'D']
    reactions = ['R1: S->P', 'R2: S->B', 'R3: P->D']
    # Rows: S, P, B, D; Columns: R1, R2, R3
    N = [
        [-1.0, -1.0,  0.0],  # S
        [ 1.0,  0.0, -1.0],  # P
        [ 0.0,  1.0,  0.0],  # B
        [ 0.0,  0.0,  1.0],  # D
    ]
    return StoichiometricNetwork(species, reactions, N)


def get_m2_network():
    """
    Model M2 network:
    Species: S, I, P, B, D
    Reactions:
      R1: S -> I (productive surface adsorption/reaction)
      R2: I -> P (intermediate turnover)
      R3: S -> B (side pathway)
      R4: P -> D (product degradation)
    """
    species = ['S', 'I', 'P', 'B', 'D']
    reactions = ['R1: S->I', 'R2: I->P', 'R3: S->B', 'R4: P->D']
    # Rows: S, I, P, B, D; Columns: R1, R2, R3, R4
    N = [
        [-1.0,  0.0, -1.0,  0.0],  # S
        [ 1.0, -1.0,  0.0,  0.0],  # I
        [ 0.0,  1.0,  0.0, -1.0],  # P
        [ 0.0,  0.0,  1.0,  0.0],  # B
        [ 0.0,  0.0,  0.0,  1.0],  # D
    ]
    return StoichiometricNetwork(species, reactions, N)
