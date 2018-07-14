// Pentominos

// Tache de fond (WebWorker) qui teste et cherche des solutions

// Author  : Ahmed Louali
// Created : 2018-06-21

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals */

importScripts('lib/utils.js')
importScripts('lib/matrix.js')

///////////////////////////////////////////////////////////////////////////////
// MAIN - Lorsque le DOM est entièrement défini
///////////////////////////////////////////////////////////////////////////////

// Liste de toutes les pièces, sera complété par symétrie / rotations
// Et le n° intérieur de la pièce qui n'est pas 0 est remplacé par l'id de la pièce

var lpieces = [
    {id:101, name:"L", formes:[[[1,1,1,1],[1,0,0,0]]]},
    {id:102, name:"V", formes:[[[1,1,1],[1,0,0],[1,0,0]]]},
    {id:103, name:"U", formes:[[[1,1,1],[1,0,1]]]},
    {id:104, name:"Y", formes:[[[1,1,1,1],[0,1,0,0]]]},
    //{id:105, name:"W", formes:[[[0,1,1],[1,1,0],[1,0,0]]]},
    {id:106, name:"P", formes:[[[1,1,1],[1,1,0]]]},
    {id:107, name:"N", formes:[[[1,1,1,0],[0,0,1,1]]]}
  ];

function initPieces() {
  // Création des pièces
  
  // (1) Remplacement des 1 par l'id de la pièce
  lpieces.forEach(piece => matrixReplace(piece.formes[0], 1, piece.id));
  
  // (2) Ajout des 3 rotations, si pas déjà présent
  lpieces.forEach(piece => {
    let forme = piece.formes[0];
    times(3, () => {
      forme = matrixRotate(forme);
      if (!piece.formes.map(JSON.stringify).find(sforme => sforme === JSON.stringify(forme))) {
        piece.formes.push(forme);
      }
    })
  });
  
  // (3) Ajout de la transposée et de ses 3 rotations si pas déjà présent
  lpieces.forEach(piece => {
    let forme = matrixTranspose(piece.formes[0]);
    times(4, () => {
      forme = matrixRotate(forme);
      if (!piece.formes.map(JSON.stringify).find(sforme => sforme === JSON.stringify(forme))) {
        piece.formes.push(forme);
      }
    })
  });
  
}

// Fonction récursive : test d'insertion de la pièce n° <npiece> 
// dans la matrice <puzzle>
function testInsertPuzzle(puzzle, npiece) {
  if (npiece>=lpieces.length) {
    postMessage({matrix:puzzle});
  } else {
    for(let y=0; y<puzzle.length; y++){
      for(let x=0; x<puzzle[0].length; x++){
        lpieces[npiece].formes.forEach(forme => {
          if (matrixCanInsert(puzzle, forme, y, x)) {
            matrixInsert(puzzle, forme, y, x);
            testInsertPuzzle(puzzle, npiece+1);
            matrixReplace(puzzle, lpieces[npiece].id, 0);
          }
        })
      }
    }
  }
}


function test() {
  let puzzle = matrix(5, 7);
  puzzle[4][3] = 127;
  puzzle[4][4] = 127;
  puzzle[4][5] = 127;
  puzzle[4][6] = 127;
  
  // Test d'insertion des pièces
  for(let y=0; y<puzzle.length; y++){
    for(let x=0; x<puzzle[0].length; x++){
      let nday = y*7 + x + 1;
      if (nday <=31) {
        puzzle[y][x] = nday;
        testInsertPuzzle(puzzle, 0);
        puzzle[y][x] = 0;
      }
    }
  }
  
  postMessage({"message":"end"});
}

initPieces()
test()
