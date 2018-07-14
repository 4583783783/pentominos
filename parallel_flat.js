// Pentominos

// Tache de fond (WebWorker) qui teste et cherche des solutions
// Version qui remplace les tableaux de tableaux par des tableaux à 1D dimension
// étalés à plat :
// - suppose une largeur standard de toutes les matrices à la même largeur (celle du puzzle)
// - chaque pièce contient non plus ses trous mais le décalage où se trouvent ses 5 éléments (+n1, +n2, +n3, +n4, +n5)

// Author  : Ahmed Louali
// Created : 2018-06-21

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals */

importScripts('lib/utils.js');
importScripts('lib/matrix.js');

///////////////////////////////////////////////////////////////////////////////
// MAIN - Lorsque le DOM est entièrement défini
///////////////////////////////////////////////////////////////////////////////

// Largeur globale du puzzle
var gw = 7;

// Hauteur globale du puzzle
var gh = 5;

// Taille globale du puzzle
var gl = gw * gh;

// Taille des pièces en nombre de carrés
var gp = 5;

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

// Indique si on peut insérer la matrice <mat2> dans la matrice <mat1>
// à l'emplacement <y, x>, c'est à dire si la taille est suffisante,
// et si chaque emplacement non nul de <mat2> correspondant à un emplacement nul de <mat1>
function matrix1DCanInsert(puzzle, forme1D, id, p){
  return ((p % gw) + forme1D.w <= gw) && (p + forme1D.forme1D[gp-1] < gl) && forme1D.forme1D.every((p2) => (puzzle[p+p2] === 0));
}

// Insère (il faut vérifer que le canInsert() est possible d'abord !!!) tous
// les éléments non nuls de <mat2> dans <mat1> à l'emplacement <x, y>
// Renvoie true si l'insertion 
function matrix1DInsert(puzzle, forme1D, id, p){
  forme1D.forme1D.forEach(p2 => puzzle[p+p2] = id);
}

// Dans la matrice, remplace chaque occurence de oldValue par newValue
// Renvoie la matrice
function matrix1Dreplace(puzzle, oldValue, newValue) {
  puzzle.forEach((value, p) => {
    if (value === oldValue) {
      puzzle[p] = newValue;
    }
  })
  return puzzle;
}

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
  
  // (4) Applatissement en 1D avec décalage (+n1, à +n5) au lieu de position
  lpieces.forEach(piece => {
    piece.formes1D = [];
    piece.formes.forEach(forme => {
      let forme1D = []
      forme.forEach((row, y) => {
        row.forEach((value, x) => {
          if(value){
            forme1D.push(y*gw+x);
          }
        });
      });
      piece.formes1D.push({"forme1D": forme1D, "w":forme[0].length});
    });
  });

  // (5) Destruction des formes 2D pour être sûr plus utilisées
  delete lpieces.formes;
}

// Fonction récursive : test d'insertion de la pièce n° <npiece> 
// dans la matrice <puzzle>
function testInsertPuzzle(puzzle, npiece) {
  if (npiece>=lpieces.length) {
    postMessage({"flatmatrix": puzzle, "w": gw, "h": gh});
  } else {
    for(let p =0; p < gl-gp; p++){
      lpieces[npiece].formes1D.forEach(forme1D => {
        if (matrix1DCanInsert(puzzle, forme1D, lpieces[npiece].id, p)) {
          matrix1DInsert(puzzle, forme1D, lpieces[npiece].id, p);
          testInsertPuzzle(puzzle, npiece+1);
          matrix1Dreplace(puzzle, lpieces[npiece].id, 0);
        }
      })
    }
  }
}


function test() {
  let puzzle = dup(gl, 0);
  puzzle[4*gw+3] = 127;
  puzzle[4*gw+4] = 127;
  puzzle[4*gw+5] = 127;
  puzzle[4*gw+6] = 127;
  
  // Test d'insertion des pièces
  for(let p = 0; p < gl ; p++){
    if (p <31) {
      puzzle[p] = p+1;
      testInsertPuzzle(puzzle, 0);
      puzzle[p] = 0;
    }
  }
  
  postMessage({"message":"end"});
}

initPieces()
test()
