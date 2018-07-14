// Pentominos

// Tache de fond (WebWorker) qui teste et cherche des solutions
//
// Version avec le coeur Flatland 1D encore plus poussé dans l'optimisation : 
// code moins élégant, remplacement des forEach par des for, des globales, bref plus "C++"
//
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
// GLOBALES
///////////////////////////////////////////////////////////////////////////////

// Largeur globale du puzzle
var gw = 7;

// Hauteur globale du puzzle
var gh = 5;

// Taille globale du puzzle
var gl = gw * gh;

// Taille des pièces en nombre de carrés
var gp = 5;

// Tableau applati contenant le puzzle en cours
var puzzle = [];

// Tableau applati contenant toutes les formes de toutes les pièces
var lflatpieces = []; // Tout dans un tableau d'entiers, pour passage futur à asm.js

// Nombre de pieces
var npieces = 0; // Déterminé à la fin de initPieces()


///////////////////////////////////////////////////////////////////////////////
// INITIALISATION : CRÉATION DES PIECES
///////////////////////////////////////////////////////////////////////////////

function initPuzzle() {
  puzzle = dup(gl, 0);
  puzzle[4*gw+3] = 127;
  puzzle[4*gw+4] = 127;
  puzzle[4*gw+5] = 127;
  puzzle[4*gw+6] = 127;
  
  // Transformation en tableau de taille statique typé
  puzzle = Uint16Array.from(puzzle);
}

function initPieces() {
  // Création des pièces
  // Liste de toutes les pièces, sera complété par symétrie / rotations
  // Et le n° intérieur de la pièce qui n'est pas 0 est remplacé par l'id de la pièce

  let lpieces = [
    {id:101, name:"L", formes:[[[1,1,1,1],[1,0,0,0]]]},
    {id:102, name:"V", formes:[[[1,1,1],[1,0,0],[1,0,0]]]},
    {id:103, name:"U", formes:[[[1,1,1],[1,0,1]]]},
    {id:104, name:"Y", formes:[[[1,1,1,1],[0,1,0,0]]]},
    //{id:105, name:"W", formes:[[[0,1,1],[1,1,0],[1,0,0]]]},
    {id:106, name:"P", formes:[[[1,1,1],[1,1,0]]]},
    {id:107, name:"N", formes:[[[1,1,1,0],[0,0,1,1]]]}
  ];

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
  
  // Création liste des pièces sous forme d'un tableau complet simple d'entiers pour passage futur au module Asm.js
  
  // [ Taille Piece en Nb Carres, NbPieces, Index 1ière forme Pièce 1, NbFormesPiece 1, IdPiece 1, ..., FormePiece1...]
  npieces = lpieces.length;
  lflatpieces = [gp, npieces];
  lpieces.forEach(piece => {
    lflatpieces.push(0); // Index, sera complété après la 2e boucle
    lflatpieces.push(piece.formes1D.length);
    lflatpieces.push(piece.id);
  });
  lpieces.forEach((piece, npiece) => {
    lflatpieces[2 + npiece*3] = lflatpieces.length;
    piece.formes1D.forEach(forme1D => {
      lflatpieces = lflatpieces.concat([forme1D.w], forme1D.forme1D);
    });
  });
  
  // Transformation en tableau taille statique typé
  lflatpieces = Uint16Array.from(lflatpieces);  
}

///////////////////////////////////////////////////////////////////////////////
// TEST : RECHERCHE DE SOLUTIONS
///////////////////////////////////////////////////////////////////////////////


// Vérifie puis si ok Insère la forme définie à partir de la position <iForme1D> de lflatpieces,
// en vérifiant qu'on ne coupe pas le bord droit grace à l'info <w> de largeur de la forme
// <id> est l'id de la forme (pièce) à insérer, <p> la position applatie d'insertion
// Renvoie true si l'insertion a eu lieu
function tryPuzzleInsert(iForme1D, w, id, p){
  // (1) : test : peut-on insérer sans risque ?
  var bCanInsert = true;
  if ((p % gw) + w > gw) {
    bCanInsert = false;
  } else if (p + lflatpieces[iForme1D+gp-1] >= gl) {
    bCanInsert = false;
  } else {
    for(var i2=0; (i2 < gp) && bCanInsert; i2++){      
      bCanInsert = (puzzle[p+lflatpieces[iForme1D+i2]] === 0);
    }
  }
  
  if (bCanInsert) {
    for(var i2=0; i2 < gp; i2++){      
      puzzle[p+lflatpieces[iForme1D+i2]] = id;
    }
  }
  
  return bCanInsert;
}

// Enlève du puzzle la forme définie à partir de la position <iForme1D> de lflatpieces,
// précédemment insérée avec succès par tryPuzzleInsert à la position p
function puzzleRemove(iForme1D, p) {
  for(var i2=0; i2 < gp; i2++){      
    puzzle[p+lflatpieces[iForme1D+i2]] = 0;
  }
}

// Fonction récursive : test d'insertion de la pièce n° <npiece> 
// dans la matrice <puzzle>
function testInsertPuzzle(npiece) {
  if (npiece >= npieces) {
    postMessage({"flatmatrix": puzzle, "w": gw, "h": gh});
  } else {
    for(let p =0; p < gl-gp; p++){
      let nformes = lflatpieces[3 + npiece*3];
      for(let iforme=0; iforme<nformes; iforme++) {
        if (tryPuzzleInsert(lflatpieces[2 + npiece*3]+iforme*(gp+1)+1, lflatpieces[lflatpieces[2 + npiece*3]+iforme*(gp+1)], lflatpieces[4 + npiece*3], p)) {
          testInsertPuzzle(npiece+1);
          puzzleRemove(lflatpieces[2 + npiece*3]+iforme*(gp+1)+1, p);
        }
      }
    }
  }
}

function test() {
  for(let p = 0; p < gl ; p++){
    if (p <31) {
      puzzle[p] = p+1;
      testInsertPuzzle(0);
      puzzle[p] = 0;
    }
  }
  
  postMessage({"message":"end"});
}

///////////////////////////////////////////////////////////////////////////////
// MAIN 
///////////////////////////////////////////////////////////////////////////////

initPuzzle()
initPieces()
test()
