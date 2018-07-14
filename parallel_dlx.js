// Pentominos

// Tache de fond (WebWorker) qui teste et cherche des solutions
// Version qui utilise l'algorithme DLX de Donald Knuth

// Author  : Ahmed Louali
// Created : 2018-06-21

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals */

importScripts('lib/utils.js')
importScripts('lib/matrix.js')
importScripts('lib/dlx.js')

///////////////////////////////////////////////////////////////////////////////
// INITIALISATION : CRÉATION DES PIECES
///////////////////////////////////////////////////////////////////////////////

function initPieces(lFilterPieces, sym) {
  // Création des pièces
  // <lFilterPieces> : liste des noms de pièces authorisées, si indéfini = toutes !
  //
  // <sym>           : type de symétrie du puzzle :
  //
  //                   "rectangle" : le puzzle est rectangulaire : on bloque
  //                   les transposées et 2 rotations de la pièces P
  //                   pour éliminer les solutions par symétries (axiale ou centrale)
  //
  //                   "square" : le puzzle est carré :on bloque 
  //                   les transposées et rotations de la pièces P
  //                   pour éliminer les solutions par rotations & symétries
  
  // Liste de toutes les pièces, sera complété par symétrie / rotations
  // Et le n° intérieur de la pièce qui n'est pas 0 est remplacé par l'id de la pièce
  let lPieces = [
    {id:101, name:"L", formes:[[[1,1,1,1],[1,0,0,0]]]},
    {id:102, name:"V", formes:[[[1,1,1],[1,0,0],[1,0,0]]]},
    {id:103, name:"U", formes:[[[1,1,1],[1,0,1]]]},
    {id:104, name:"Y", formes:[[[1,1,1,1],[0,1,0,0]]]},
    {id:105, name:"P", formes:[[[1,1,1],[1,1,0]]]},
    {id:106, name:"N", formes:[[[1,1,1,0],[0,0,1,1]]]},
    {id:107, name:"W", formes:[[[0,1,1],[1,1,0],[1,0,0]]]},
    {id:108, name:"T", formes:[[[1,1,1],[0,1,0],[0,1,0]]]},
    {id:109, name:"Z", formes:[[[1,1,0],[0,1,0],[0,1,1]]]},
    {id:110, name:"F", formes:[[[0,1,1],[1,1,0],[0,1,0]]]},
    {id:111, name:"X", formes:[[[0,1,0],[1,1,1],[0,1,0]]]},
    {id:112, name:"I", formes:[[[1,1,1,1,1]]]}
  ];

  // (1) Si besoin, on ne garde que les pièces souhaitées
  if(lFilterPieces){
    lPieces = lPieces.filter(piece => lFilterPieces.includes(piece.name));
  }
  
  // (2) Remplacement des 1 par l'id de la pièce
  lPieces.forEach(piece => matrixReplace(piece.formes[0], 1, piece.id));
  
  // (3) Ajout des 3 rotations, si pas déjà présent
  lPieces.forEach(piece => {
    let forme = piece.formes[0];
    let nRot = (piece.name ==="P") ? (sym === "rectangle" ? 1 : (sym === "square" ? 0 : 3)) : 3;
    times(nRot, () => {
      forme = matrixRotate(forme);
      if (!piece.formes.map(JSON.stringify).find(sforme => sforme === JSON.stringify(forme))) {
        piece.formes.push(forme);
      }
    });
  });

  // (4) Ajout de la transposée et de ses 3 rotations si pas déjà présent
  lPieces.forEach(piece => {
    let forme = matrixTranspose(piece.formes[0]);
    let nRot = (piece.name ==="P") ? ((sym === "rectangle" || sym === "square") ? 0 : 4) : 4;
    times(nRot, () => {
      forme = matrixRotate(forme);
      if (!piece.formes.map(JSON.stringify).find(sforme => sforme === JSON.stringify(forme))) {
        piece.formes.push(forme);
      }
    });
  });
  
  return lPieces;
}

///////////////////////////////////////////////////////////////////////////////
// CRÉATION DE LA MATRICE DES POSITIONS POSIBLES DES PIECES
///////////////////////////////////////////////////////////////////////////////

// Crée et renvoie un objet à partir du puzzle et des pièces, composé de :
// {
//    lCols : liste des colonnes, chaque colonne est composée de données libres devant permettre l'identification 
//            et l'affichage des solutions (ici {type:piece, id:id} ou {type:position, id:[y,x]})
//    lRows    : matrice de lignes de numéros de colonnes, pour toutes les combinaisons de position / pièces 
// }
// pour passage à l'algorithme de recherche de DLX
function createHeadersAndRowsFrom(puzzle, lPieces) {
  
  // (1) Création des entêtes de colonnes
  let lCols = [];
  
  lPieces.forEach(piece => lCols.push({"type": "piece", "id":piece.id}));
  
  for(let y=0; y<puzzle.length; y++){
    for(let x=0; x<puzzle[0].length; x++){
      if(puzzle[y][x]===0){
        lCols.push({"type": "position", "id": [y,x]});
      }
    }
  }
  
  // (2) On ajoute une ligne pour chaque position possible de chaque forme de chaque pièce !
  let lRows = [];
  lPieces.forEach(piece => {
    piece.formes.forEach(forme => {
      for(let y=0; y<puzzle.length; y++){
        for(let x=0; x<puzzle[0].length; x++){
          if(matrixCanInsert(puzzle, forme, y, x)){
            let lRow = [];
            lRow.push(lCols.findIndex(p => p.id === piece.id));
            forme.forEach((row, y2) => {
              row.forEach((value, x2) => {
                if (value !== 0) {
                  lRow.push(lCols.findIndex(p => JSON.stringify(p.id) === JSON.stringify([y+y2, x+x2]) ));
                }
              });
            });
            lRows.push(lRow);
          }
        }
      }
    })
  });
  
  return {lCols: lCols, lRows: lRows}
}

///////////////////////////////////////////////////////////////////////////////
// MAIN 
///////////////////////////////////////////////////////////////////////////////

// Message d'initialisation appelé par le script principal
onmessage = function (e) {
  let lPieces = initPieces(e.data.lFilterPieces, e.data.sym);
  let lPuzzles = e.data.lPuzzles;
  if(lPuzzles){
    lPuzzles.forEach(puzzle => {
      
      function printSolution(lPrintRows) {
        lPrintRows.forEach(lPrintRow => {
          let id = lPrintRow.find(c => c.type === "piece").id;
          lPrintRow.filter(c => c.type === "position").map(c => c.id).forEach(pos => {
            puzzle[pos[0]][pos[1]] = id;
          });
        });
        postMessage({matrix:puzzle});
      }
      
      DLXstartSearch(createHeadersAndRowsFrom(puzzle, lPieces), printSolution);
    });
    postMessage({"message":"end"});
  } else {
    postMessage({"message":"errornopuzzle"});
  }
}
