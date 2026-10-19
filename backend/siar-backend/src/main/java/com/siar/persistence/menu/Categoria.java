package com.siar.persistence.menu;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity  //indica que JPA debe tratar la clase como una entidad persistente.
@Table(name = "CATEGORIA") //especifica que corresponde a la tabla CATEGORIA.
public class Categoria {

    @Id //identifica la clave primaria.
    @GeneratedValue(strategy = GenerationType.IDENTITY) //permite que MySQL genere el identificador automáticamente.
    @Column(name = "id_categoria") //relaciona los atributos Java con las columnas de la tabla.
    private Long idCategoria;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    // Constructor vacio
    public Categoria() {
    }

    public Categoria(String nombre) {
        this.nombre = nombre;
        this.activa = true;
    }

    public Long getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Long idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Boolean getActiva() {
        return activa;
    }

    public void setActiva(Boolean activa) {
        this.activa = activa;
    }
    
}
