package com.siar.negocio.seguridad;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.siar.persistencia.usuario.Permiso;
import com.siar.persistencia.usuario.Usuario;

// Datos del usuario que Spring Security necesita para autenticarlo.
// Se arma a partir de la entidad Usuario para no exponerla fuera de la sesion de JPA.
public class UsuarioAutenticado implements UserDetails {

    private final Long idUsuario;
    private final String nombre;
    private final String usuario;
    private final String contrasena;
    private final boolean activo;
    private final String rol;
    private final List<String> permisos;

    public UsuarioAutenticado(Usuario entidad) {
        this.idUsuario = entidad.getIdUsuario();
        this.nombre = entidad.getNombre();
        this.usuario = entidad.getUsuario();
        this.contrasena = entidad.getContrasena();
        this.activo = Boolean.TRUE.equals(entidad.getActivo());
        this.rol = entidad.getRol().getNombre();
        this.permisos = entidad.getRol().getPermisos().stream()
                .map(Permiso::getNombre)
                .sorted()
                .toList();
    }

    // Autoridades: ROLE_<rol> para las reglas por rol y cada permiso tal cual
    public static List<GrantedAuthority> autoridades(String rol, List<String> permisos) {
        List<GrantedAuthority> autoridades = new ArrayList<>();
        if (rol != null) {
            autoridades.add(new SimpleGrantedAuthority("ROLE_" + rol));
        }
        if (permisos != null) {
            permisos.forEach(permiso -> autoridades.add(new SimpleGrantedAuthority(permiso)));
        }
        return autoridades;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return autoridades(rol, permisos);
    }

    @Override
    public String getPassword() {
        return contrasena;
    }

    @Override
    public String getUsername() {
        return usuario;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public String getRol() {
        return rol;
    }

    public List<String> getPermisos() {
        return permisos;
    }
}
