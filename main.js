// Pentominos

// Le travail en tâche de fond est déporté en parallèle dans le thread Web Worker "parallel.js"

// Author  : Ahmed Louali
// Created : 2018-06-21

"use strict";

/*jshint esversion: 6, browser: true, jquery:true, strict:global */

/*globals matrix */

//////////////////////////////////////////////////////////////////////////////
//
// DESSIN HTML DES MATRICES
//
//////////////////////////////////////////////////////////////////////////////

// Dessine une table correspondant à la matrice en question
// <mat> : matrice (array de array), <n> : n° de la solution
function matrixDraw(mat, n){
  let h = mat.length;
  let w = mat[0].length;
  let s = '<div style="display:inline-block;"><p>Solution ' + n + ' :<p/><table>';
  for(let y = 0; y < h; y++) {
    s += '<tr>';
    
    for(let x = 0; x < w; x++) {
      
      s += '<td style="border-style : ';
      
      s += " " + (mat[y][x]<127 && (y === 0   || mat[y][x] !== mat[y-1][ x ]) ? "solid" : "none"); // top
      s += " " + (mat[y][x]<127 && (x === w-1 || mat[y][x] !== mat[ y ][x+1]) ? "solid" : "none"); // right
      s += " " + (mat[y][x]<127 && (y === h-1 || mat[y][x] !== mat[y+1][ x ]) ? "solid" : "none"); // bottom
      s += " " + (mat[y][x]<127 && (x === 0   || mat[y][x] !== mat[ y ][x-1]) ? "solid" : "none"); // left
      
      s += ';">' + ((mat[y][x] > 0 && mat[y][x] < 32) ? mat[y][x] : '&nbsp;') + '</td>';
      
    }
    
    s += '</tr>';
  }
  s += '</table></div>';
  
  $('#main').append(s);
}

// Dessine une table correspondant à la matrice Flat 1D en question
function matrixDrawFlat(mat1D, w, h, n){
  let mat = [];
  for(let y = 0; y < h; y++) {
    let row = [];
    for(let x = 0; x < w; x++) {
      row.push(mat1D[y*w+x]);
    }
    mat.push(row);
  }
  matrixDraw(mat, n);
}

//////////////////////////////////////////////////////////////////////////////
//
// CRÉATION DU THREAD DE RECHERCHE EN PARALLÈLE (WEBWORKER)
// ENVOI & RÉCEPTION DES MESSAGES
//
//////////////////////////////////////////////////////////////////////////////

var gWorker; // Thread de recherche de la solution en parallèle
// Avantage 1 : utilisation des processeurs multi-core !
// Avantage 2 : ne gèle pas l'interface pendant la recherche !

function startWorker(sParallelScript, sPuzzleType) {
  let t = Date.now();
  let n = 0; // N° de la solution à afficher
  
  if(Worker) {
    if(gWorker) {
      stopWorker();
    }
    $('#main').empty();
    n = 0;
    gWorker = new Worker(sParallelScript);
    
    gWorker.onmessage = function(event) {
      if (event.data.message === "end") {
        $('#main').append($('<p>').text('Temps total : ' + (Date.now()-t)/1000. + 's'));
        stopWorker();
      } else if (event.data.message === "errornopuzzle") {
        $('#main').append($('<p>').text('ERREUR : aucun puzzle défini !'));
      } else if (event.data.matrix) {
        n++;
        matrixDraw(event.data.matrix, n);
      } else if (event.data.flatmatrix) {
        n++;
        matrixDrawFlat(event.data.flatmatrix, event.data.w, event.data.h, n);
      }
    };
    
    // Si <sPuzzleType> est défini, on est dans le cas de l'algorithme DLX (les autres algoritmes ne gèrent qu'un cas !)
    if(sPuzzleType){
      switch (sPuzzleType) {
        
        case "irem": {
          let lPuzzles = [];
          for(let nday=0; nday<31; nday++){
            let puzzle = matrix(5, 7);
            puzzle[Math.trunc(nday / 7)][nday % 7] = nday+1;
            puzzle[4][3] = puzzle[4][4] = puzzle[4][5] = puzzle[4][6] = 127;
            lPuzzles.push(puzzle);
          }
          gWorker.postMessage({lPuzzles:lPuzzles, lFilterPieces:["L", "V", "U", "Y", "P", "N"]});
          break;
        }
          
        case "3x20": {
          gWorker.postMessage({lPuzzles:[matrix(3, 20)], sym:"rectangle"});
          break;
        }

        case "4x15": {
          gWorker.postMessage({lPuzzles:[matrix(4, 15)], sym:"rectangle"});
          break;
        }
          
        case "5x12": {
          gWorker.postMessage({lPuzzles:[matrix(5, 12)], sym:"rectangle"});
          break;
        }
          
        case "6x10": {
          gWorker.postMessage({lPuzzles:[matrix(6, 10)], sym:"rectangle"});
          break;
        }

        case "8x8": {
          let puzzle = matrix(8, 8);
          puzzle[3][3] = puzzle[3][4] = puzzle[4][3] = puzzle[4][4] = 127;
          gWorker.postMessage({lPuzzles:[puzzle], sym:"square"});
          break;
        }
          
        default:
          $('#main').append($('<p>').text(`ERREUR : Type de puzzle "${sPuzzleType}" non géré !`));
      }
    }
    
  } else {
    $('#main').append($('<p>').text('Désolé, votre navigateur ne prend pas encharge les Web Worker. Utilisez une version récente de Firefox ou Chromium'))
  }
}

function stopWorker() {
  if(gWorker){
    gWorker.terminate();
    gWorker = undefined;
  }
}

///////////////////////////////////////////////////////////////////////////////
// MAIN - Lorsque le DOM est entièrement défini
///////////////////////////////////////////////////////////////////////////////

$(function () {
});
