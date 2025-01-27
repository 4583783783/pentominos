// Dimensions du plateau
const boardWidth = 10;
const boardHeight = 6;

// Définition des pentominos (formes de base)
const pentominos = [
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Ligne droite
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], // En L
  [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]], // En T
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], // En Z
  [[0, 0], [0, 1], [1, 0], [1, 1], [1, 2]], // En P
];

// Plateau de jeu
let board = [];

// Initialisation du plateau
function createBoard() {
  board = Array.from({ length: boardHeight }, () =>
    Array(boardWidth).fill(0)
  );

  const boardElement = document.getElementById("game-board");
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${boardWidth}, 40px)`;

  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      boardElement.appendChild(cell);
    }
  }
}

// Vérification de placement d'une pièce
function canPlace(piece, offsetX, offsetY) {
  return piece.every(([dx, dy]) => {
    const x = dx + offsetX;
    const y = dy + offsetY;
    return (
      x >= 0 &&
      x < boardWidth &&
      y >= 0 &&
      y < boardHeight &&
      board[y][x] === 0
    );
  });
}

// Placement d'une pièce sur le plateau
function placePiece(piece, offsetX, offsetY) {
  piece.forEach(([dx, dy]) => {
    const x = dx + offsetX;
    const y = dy + offsetY;
    board[y][x] = 1;

    const cell = document.querySelector(
      `.cell[data-x="${x}"][data-y="${y}"]`
    );
    if (cell) cell.classList.add("occupied");
  });
}

// Algorithme de backtracking
function solvePentominos(index = 0) {
  if (index === pentominos.length) return true;

  const piece = pentominos[index];
  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      if (canPlace(piece, x, y)) {
        placePiece(piece, x, y);
        if (solvePentominos(index + 1)) return true;
        removePiece(piece, x, y);
      }
    }
  }
  return false;
}

// Réinitialisation du plateau
function resetBoard() {
  createBoard();
}

// Événements
document.getElementById("solve-btn").addEventListener("click", () => {
  if (!solvePentominos()) alert("Aucune solution trouvée !");
});

document.getElementById("reset-btn").addEventListener("click", resetBoard);

// Initialisation
createBoard();
